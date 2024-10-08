package ws

import (
	"encoding/json"
	"errors"
	"log"
	"sync"
	"time"

	"gorm.io/gorm"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	timers     map[string]*timer
	mu         sync.RWMutex
	ping       chan *Client
	db         *gorm.DB
}

func NewHub(db *gorm.DB) *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		timers:     make(map[string]*timer),
		ping:       make(chan *Client),
		db:         db,
	}
}

func (h *Hub) Run() {
	go h.startPing()
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("Client registered: %v", client.userId)
			log.Printf("Total active clients: %d", h.ClientCount())
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()
			log.Printf("Client unregistered: %v", client.userId)
			log.Printf("Total active clients: %d", h.ClientCount())
		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
					log.Printf("Failed to send to client, removed: %v", client.userId)
				}
			}
			h.mu.RUnlock()
		case client := <-h.ping:
			client.ping <- struct{}{}
		}
	}
}

func (h *Hub) startPing() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		h.mu.Lock()
		for client := range h.clients {
			h.ping <- client
			if now.Sub(client.lastPong) > 60*time.Second {
				log.Printf("Unregistering client, last pong response was more than 60 sec: %v", client.userId)
				disconnectMessage := &Message{
					Type: "disconnect",
					Data: json.RawMessage(`{"reason": "Inactivity"}`),
				}
				messageBytes, _ := json.Marshal(disconnectMessage)
				client.send <- messageBytes

				client.conn.Close()
				h.unregister <- client
			}
		}
		h.mu.Unlock()
	}
}

func (h *Hub) startTimer(countdown int, timerType string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if existingTimer, ok := h.timers[timerType]; ok {
		existingTimer.stop()
	}
	newTimer := newTimer(h, countdown, timerType)
	h.timers[timerType] = newTimer
	newTimer.start()
}

func (h *Hub) stopTimer(timerType string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if existingTimer, ok := h.timers[timerType]; ok {
		existingTimer.stop()
		delete(h.timers, timerType)
	}
}

func (h *Hub) resetTimer(countdown int, timerType string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if existingTimer, ok := h.timers[timerType]; ok {
		existingTimer.stop()
	}
	newTimer := newTimer(h, countdown, timerType)
	h.timers[timerType] = newTimer
	newTimer.start()
}

// ClientCount returns the number of registered clients
func (h *Hub) ClientCount() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.clients)
}

func (h *Hub) GetTimer(timerType string) (int, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if timer, exists := h.timers[timerType]; exists {
		return timer.countdown, nil
	}
	return 0, errors.New("timer not found")
}
