package ws

import (
	"context"
	"encoding/json"
	"log"
	"time"

	e "github.com/Ajstraight619/pictionary-server/internal/events"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer. // This is going to be the compressed drawing data.
	maxMessageSize = 20480
)

var (
	newline = []byte{'\n'}
)

type Client struct {
	Hub      *Hub
	Send     chan []byte
	Conn     *websocket.Conn
	PlayerID string
	ctx      context.Context
	cancel   context.CancelFunc
}

func NewClient(hub *Hub, conn *websocket.Conn, playerID string) *Client {
	ctx, cancel := context.WithCancel(hub.ctx)
	return &Client{
		Hub:      hub,
		Send:     make(chan []byte, 256),
		Conn:     conn,
		PlayerID: playerID,
		ctx:      ctx,
		cancel:   cancel,
	}
}

func (c *Client) Read() {
	defer func() {
		log.Printf("Client.Read: unregistering and closing connection for player %s", c.PlayerID)
		c.Hub.Unregister <- c
		c.cancel()
		c.Conn.Close()
	}()
	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	recognizedEvents := map[string]bool{
		e.GameState:         true,
		e.PlayerGuess:       true,
		e.StartTimer:        true,
		e.StopTimer:         true,
		e.SelectWord:        true,
		e.PlayerReady:       true,
		e.PlayerToggleReady: true,
	}

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			log.Printf("Client.Read: error for player %s: %v", c.PlayerID, err)
			break
		}

		var gameEvent e.GameEvent
		// Try to parse the message as a GameEvent.
		if err := json.Unmarshal(message, &gameEvent); err == nil && gameEvent.Type != "" {
			// Only handle if it's a recognized event
			if recognizedEvents[gameEvent.Type] {
				select {
				case <-c.ctx.Done():
					log.Printf("Client.Read: context cancelled for player %s", c.PlayerID)
					return
				case c.Hub.GameEvents <- gameEvent:
					log.Printf("Client.Read: Dispatched game event %s for player %s", gameEvent.Type, c.PlayerID)
					continue // Skip broadcasting; it is handled internally.
				default:
					log.Printf("Client.Read: GameEvents channel full, discarding event for player %s", c.PlayerID)
				}
			}
		}

		// ! Broadcast messages to all clients that do not change the internal game state.
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
		case <-c.ctx.Done():
			log.Printf("Client.Write: context cancelled for player %s", c.PlayerID)
			return
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
			for range n {
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

func (c *Client) SendMessage(data []byte) error {
	return c.Conn.WriteMessage(websocket.TextMessage, data)
}

func (c *Client) Close() error {
	return c.Conn.Close()
}
