package ws

type HubManager struct {
	hubs map[string]*Hub
}

func NewHubManager() *HubManager {
	return &HubManager{
		hubs: make(map[string]*Hub),
	}

}

func (m *HubManager) GetHub(roomId string) *Hub {
	hub, exists := m.hubs[roomId]
	if !exists {
		hub = NewHub()
		m.hubs[roomId] = hub
		go hub.Run()
	}
	return hub
}
