package ws

import (
	"gorm.io/gorm"
)

type HubManager struct {
	hubs map[string]*Hub
	db   *gorm.DB
}

func NewHubManager(db *gorm.DB) *HubManager {
	return &HubManager{
		hubs: make(map[string]*Hub),
		db:   db,
	}
}

func (m *HubManager) GetHub(roomId string) *Hub {
	hub, exists := m.hubs[roomId]
	if !exists {
		hub = NewHub(m.db)
		m.hubs[roomId] = hub
		go hub.Run()
	}
	return hub
}
