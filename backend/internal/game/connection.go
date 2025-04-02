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

	// Check if this was the last connected player (for logging)
	allDisconnected := true
	for _, player := range g.Players {
		if player.Connected {
			allDisconnected = false
			break
		}
	}
	if allDisconnected {
		log.Println("All players have disconnected from game:", g.ID)
	}
	g.Mu.Unlock()

	// Update last activity
	g.UpdateLastActivity()

	go func() {
		time.Sleep(30 * time.Second)
		g.Mu.Lock()
		defer g.Mu.Unlock()

		if player, exists := g.Players[playerID]; exists && !player.Connected {
			g.RemovePlayer(playerID)
			log.Println("Player removed due to disconnection:", playerID)
			g.Messenger.BroadcastMessage([]byte("Player removed due to disconnection: " + playerID))

			// Check again if this was the last player
			if len(g.Players) == 0 && g.Status != 2 { // 2 = Finished status
				log.Println("All players have left the game, initiating cleanup")
				// Notify lifecycle handler after a short delay to allow for possible reconnections
				time.AfterFunc(5*time.Second, func() {
					if g.lifecycle != nil {
						g.lifecycle.OnGameEnded(g.ID)
					}
				})
			}
		}
	}()
}
