package ws

import "sync"

type Hub struct {
	Broadcast  chan []byte
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
}

type Hubs struct {
	mu   sync.RWMutex
	Hubs map[string]*Hub
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan []byte),
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
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}
		case message := <-h.Broadcast:
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
		}
	}
}
