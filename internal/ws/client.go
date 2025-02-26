package ws

import "github.com/gorilla/websocket"

type Client struct {
	Hub      *Hub
	Send     chan []byte
	Conn     *websocket.Conn
	PlayerID string
}

func NewClient(hub *Hub, conn *websocket.Conn, playerID string) *Client {
	return &Client{
		Hub:      hub,
		Send:     make(chan []byte),
		Conn:     conn,
		PlayerID: playerID,
	}
}

// Read reads messages from the websocket connection and broadcasts them to the hub.
func (c *Client) Read() {
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		c.Hub.Broadcast <- message
	}
	c.Hub.Unregister <- c
}

// Write writes messages from the Send channel to the websocket connection.
func (c *Client) Write() {
	for message := range c.Send {
		err := c.Conn.WriteMessage(websocket.TextMessage, message)
		if err != nil {
			break
		}
	}
	c.Conn.Close()
}
