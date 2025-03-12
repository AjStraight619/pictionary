package game

import (
	"log"
	"time"
)

func (g *Game) HandleDisconnect(playerID string) {
	g.Mu.Lock()
	if player, exists := g.Players[playerID]; exists {
		player.Connected = false
	}
	g.Mu.Unlock()

	go func() {
		time.Sleep(30 * time.Second)
		g.Mu.Lock()
		defer g.Mu.Unlock()
		if player, exists := g.Players[playerID]; exists && !player.Connected {
			g.RemovePlayer(playerID)
			log.Println("Player removed due to disconnection:", playerID)
			g.Messenger.BroadcastMessage([]byte("Player removed due to disconnection: " + playerID))

		}
	}()
}
