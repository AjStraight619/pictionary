package ws

import (
	"encoding/json"
	"fmt"
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

type ChatMessageData struct {
	Id        string `json:"id"`
	Username  string `json:"username"`
	Message   string `json:"message"`
	IsCorrect bool   `json:"isCorrect"`
	IsClose   bool   `json:"isClose"`
}

type ChatMessage struct {
	Type string          `json:"type"`
	Data ChatMessageData `json:"data"`
}

type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	lastPong time.Time
	ping     chan struct{}
	userId   string
	roomId string
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
			var chatMessage ChatMessage
			err = json.Unmarshal(msg.Data, &chatMessage)
			if err != nil {
				log.Println("Error unmarshalling chat message data:", err)
				continue
			}

			if chatMessage.Data.IsCorrect {
				remainingTime, err := c.hub.GetTimer("round_timer")
				if err == nil {
					score := c.CalculateScore(remainingTime)
					scoreMessage := &Message{
						Type: "score",
						Data: json.RawMessage(fmt.Sprintf(`{"score": %d}`, score)),
					}
					scoreMessageBytes, err := json.Marshal(scoreMessage)
					if err == nil {
						c.send <- scoreMessageBytes
					} else {
						log.Println("Error marshalling score message:", err)
					}
				} else {
					log.Println("Error getting timer:", err)
				}
			}

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

func (c *Client) CalculateScore(time int) int {
	score := time * 10
	return score
}

