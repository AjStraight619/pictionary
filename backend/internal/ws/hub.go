package ws

import (
	"context"
	"log"
	"sync"

	e "github.com/Ajstraight619/pictionary-server/internal/events"
)

type delivery struct {
	playerID string
	exclude  bool
	message  []byte
}

type Hub struct {
	deliveries   chan delivery
	ctx          context.Context
	Broadcast    chan []byte
	GameEvents   chan e.GameEvent
	Clients      map[*Client]bool
	Register     chan *Client
	Unregister   chan *Client
	OnDisconnect func(playerID string)
}

type Hubs struct {
	mu   sync.RWMutex
	Hubs map[string]*Hub
}

func NewHub(ctx context.Context) *Hub {
	return &Hub{
		ctx:        ctx,
		deliveries: make(chan delivery),
		Broadcast:  make(chan []byte),
		GameEvents: make(chan e.GameEvent, 10),
		Clients:    make(map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func NewHubs() *Hubs {
	return &Hubs{
		Hubs: make(map[string]*Hub),
	}
}

func (h *Hubs) AddHub(gameID string, hub *Hub) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.Hubs[gameID] = hub
}

func (h *Hubs) GetHub(gameID string) (*Hub, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	hub, exists := h.Hubs[gameID]
	return hub, exists
}

func (h *Hubs) RemoveHub(gameID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.Hubs, gameID)
}

func (h *Hub) Run() {
	defer h.cleanup()

	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				if h.OnDisconnect != nil {
					go h.OnDisconnect(client.PlayerID)
				}
			}
		case request := <-h.deliveries:
			for client := range h.Clients {
				if (client.PlayerID == request.playerID) != request.exclude {
					h.enqueue(client, request.message)
				}
			}
		case message := <-h.Broadcast:
			for client := range h.Clients {
				h.enqueue(client, message)
			}
		case <-h.ctx.Done():
			log.Printf("Hub is shutting down...")
			return
		}
	}
}

// Only Run owns Clients and closes outgoing queues.
func (h *Hub) enqueue(client *Client, message []byte) {
	select {
	case client.Send <- message:
	default:
		delete(h.Clients, client)
		close(client.Send)
		client.Conn.Close()
		if h.OnDisconnect != nil {
			go h.OnDisconnect(client.PlayerID)
		}
	}
}

func (h *Hub) BroadcastMessage(message []byte) {
	select {
	case h.Broadcast <- message:
	case <-h.ctx.Done():
	}
}
func (h *Hub) SendToOthers(playerID string, message []byte) {
	select {
	case h.deliveries <- delivery{playerID: playerID, exclude: true, message: message}:
	case <-h.ctx.Done():
	}
}
func (h *Hub) SendToPlayer(playerID string, message []byte) {
	select {
	case h.deliveries <- delivery{playerID: playerID, message: message}:
	case <-h.ctx.Done():
	}
}

func (h *Hub) GameEventChannel() <-chan e.GameEvent {
	return h.GameEvents
}

func (h *Hub) cleanup() {
	for client := range h.Clients {
		close(client.Send)
		client.Conn.Close()
		delete(h.Clients, client)
	}
	// Input channels have multiple producers. Cancellation stops sends; do not close them.
}
