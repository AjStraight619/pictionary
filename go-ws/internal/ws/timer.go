package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

type timer struct {
	countdown int
	ticker    *time.Ticker
	hub       *Hub
	timerType string
	mu        sync.Mutex
}

func newTimer(hub *Hub, countdown int, timerType string) *timer {
	return &timer{
		countdown: countdown,
		hub:       hub,
		timerType: timerType,
	}
}

func (t *timer) start() {
	t.ticker = time.NewTicker(1 * time.Second)
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered in start: %v", r)
			}
		}()
		for {
			select {
			case <-t.ticker.C:
				t.mu.Lock()
				if t.countdown > 0 {
					t.countdown--
					t.mu.Unlock()
					t.broadcastCountdown()
				} else {
					t.mu.Unlock()
					t.stop()
					return
				}
			}
		}
	}()
}

func (t *timer) broadcastCountdown() {
	data, err := json.Marshal(map[string]interface{}{
		"time":      t.countdown,
		"timerType": t.timerType,
	})
	if err != nil {
		log.Println("Error marshaling countdown data:", err)
		return
	}

	message := &Message{
		Type: "countdown",
		Data: data,
	}

	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Println("Error marshaling message:", err)
		return
	}
	t.hub.broadcast <- messageBytes
}

func (t *timer) stop() {
	t.mu.Lock()
	defer t.mu.Unlock()
	if t.ticker != nil {
		log.Println("Stopping timer:", t.timerType)
		t.ticker.Stop()
		t.ticker = nil
	}
}
