package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type       string          `json:"type"`
	Compressed bool            `json:"compressed,omitempty"`
	Data       json.RawMessage `json:"data"`
}

type TimerData struct {
	Time      int    `json:"time"`
	TimerType string `json:"timerType"`
}

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	lastPong time.Time
	ping     chan struct{}
	userId   string
}

func (c *Client) readMessages() {
	defer func() {
		c.conn.Close()
		c.hub.unregister <- c
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message:", err)
			return
		}

		// Check if the message is a custom "ping" message
		if string(message) == "ping" {
			log.Println("Received custom ping message")
			c.send <- []byte("pong")
			continue
		}

		var msg Message
		err = json.Unmarshal(message, &msg)
		if err != nil {
			log.Println("Error unmarshalling msg:", err)
			continue
		}

		switch msg.Type {
		case "countdown":
			var timerData TimerData
			err = json.Unmarshal(msg.Data, &timerData)
			if err != nil {
				log.Println("Error unmarshalling timer data:", err)
				continue
			}
			c.hub.startTimer(timerData.Time, timerData.TimerType)
		case "stop_timer":
			var timerData TimerData
			err = json.Unmarshal(msg.Data, &timerData)
			if err != nil {
				log.Println("Error unmarshalling timer data:", err)
				continue
			}
			log.Println("Stopping timer: ", timerData.TimerType)
			c.hub.stopTimer(timerData.TimerType)
		case "chat":
			c.hub.broadcast <- message
		default:
			c.hub.broadcast <- message
		}
	}
}

func (c *Client) writeMessages() {
	defer func() {
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			err := c.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Println("Error writing message: ", err)
				return
			}

		case <-c.ping:
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Println("Error writing ping message: ", err)
				return
			}
			log.Println("Sent ping message")
		}
	}
}
