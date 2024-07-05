package ws

import (
	"log"
	"sync"
	"time"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	timers     map[string]*timer
	mu         sync.Mutex
	ping       chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		timers:     make(map[string]*timer),
		ping:       make(chan *Client),
	}
}

func (h *Hub) Run() {
	go h.startPing()
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, exists := h.clients[client]; exists {
				log.Printf("Client already registered: %v", client.userId)
				h.mu.Unlock()
			} else {
				h.clients[client] = true
				h.mu.Unlock()
				log.Printf("Client registered: %v", client.userId)
			}
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("Client unregistered: %v", client.userId)
			}
			h.mu.Unlock()
		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.send <- message:
					log.Printf("Sent to client: %v", client.userId)
				default:
					close(client.send)
					delete(h.clients, client)
					log.Printf("Failed to send to client, removed: %v", client.userId)
				}
			}
			h.mu.Unlock()
		case client := <-h.ping:
			client.ping <- struct{}{}
		}
	}
}

func (h *Hub) startPing() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			now := time.Now()
			h.mu.Lock()
			for client := range h.clients {
				h.ping <- client
				if now.Sub(client.lastPong) > 60*time.Second {
					log.Println("Unregistering client, last pong response was more than 60 sec:", client.userId)
					client.conn.Close()
					h.unregister <- client
				}
			}
			h.mu.Unlock()
		}
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

// ClientCount returns the number of registered clients
func (h *Hub) ClientCount() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.clients)
}
