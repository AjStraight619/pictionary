package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	e "github.com/Ajstraight619/pictionary-server/internal/events"
	g "github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.

	maxMessageSize = 20480
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	Hub      *Hub
	Send     chan []byte
	Conn     *websocket.Conn
	PlayerID string
}

func NewClient(hub *Hub, conn *websocket.Conn, playerID string) *Client {
	return &Client{
		Hub:      hub,
		Send:     make(chan []byte, 256),
		Conn:     conn,
		PlayerID: playerID,
	}
}

func (c *Client) Read() {
	defer func() {
		log.Printf("Client.Read: unregistering and closing connection for player %s", c.PlayerID)
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			log.Printf("Client.Read: error for player %s: %v", c.PlayerID, err)
			break
		}

		var gameEvent e.GameEvent
		if err := json.Unmarshal(message, &gameEvent); err == nil && gameEvent.Type != "" {
			select {
			case c.Hub.GameEvents <- gameEvent:
			default:
				// If the channel is full or not ready, you might log and continue.
				log.Printf("Client.Read: GameEvents channel full, discarding event for player %s", c.PlayerID)
			}
		} else {
			// Not a valid event; broadcast or process as a normal message.
			c.Hub.Broadcast <- message
		}

		c.Hub.Broadcast <- message
	}

}

func (c *Client) Write() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
		log.Printf("Client.Write: connection closed for player %s", c.PlayerID)
	}()
	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				log.Printf("Client.Write: Send channel closed for player %s", c.PlayerID)
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				log.Printf("Client.Write: NextWriter error for player %s: %v", c.PlayerID, err)
				return
			}
			if _, err := w.Write(message); err != nil {
				log.Printf("Client.Write: Write error for player %s: %v", c.PlayerID, err)
				return
			}
			// Drain queued messages.
			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				additional := <-c.Send
				if _, err := w.Write(additional); err != nil {
					log.Printf("Client.Write: error writing queued message for player %s: %v", c.PlayerID, err)
					return
				}
			}
			if err := w.Close(); err != nil {
				log.Printf("Client.Write: writer close error for player %s: %v", c.PlayerID, err)
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Client.Write: ping error for player %s: %v", c.PlayerID, err)
				return
			}
		}
	}
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func ServeWs(c echo.Context, hubs *Hubs, games *g.Games) error {
	gameID := c.Param("id")
	log.Printf("ServeWs: received gameID: %s", gameID)

	game, exists := games.GetGameByID(gameID)
	if !exists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Game not found"})
	}

	hub, exists := hubs.GetHub(gameID)
	if !exists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Hub not found"})
	}

	playerID := c.QueryParam("playerID")
	username := c.QueryParam("username")

	if playerID == "" || username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "PlayerID and Username are required"})
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Unable to upgrade connection"})
	}

	// Update the player's connection status in the game state.
	player := game.GetPlayerByID(playerID)
	if player == nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Player not found"})
	}
	player.Pending = false
	player.Connected = true
	player.Client = NewClient(hub, conn, playerID)

	if wsClient, ok := player.Client.(*Client); ok {
		hub.Register <- wsClient
	} else {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
	}

	go player.Client.Write()
	go player.Client.Read()

	msgType := "playerJoined"
	payload := map[string]interface{}{
		"player": player,
	}

	b, err := utils.CreateMessage(msgType, payload)

	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
	}

	hub.Broadcast <- b

	// Temporary fix to make sure the game state the ws connection is
	time.AfterFunc(200*time.Millisecond, func() {
		log.Println("game state:", game)
		game.BroadcastGameState()
	})

	return nil
}

func (c *Client) SendMessage(data []byte) error {
	return c.Conn.WriteMessage(websocket.TextMessage, data)
}

func (c *Client) Close() error {
	return c.Conn.Close()
}
