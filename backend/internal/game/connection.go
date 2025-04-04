package game

import (
	"log"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

const (
	// Grace period for disconnected players to reconnect (in seconds)
	PlayerReconnectGracePeriod = 30
)

func (g *Game) HandleDisconnect(playerID string) {
	g.Mu.Lock()

	// Check if player exists
	player, exists := g.Players[playerID]
	if !exists {
		g.Mu.Unlock()
		return
	}

	player.Connected = false
	log.Printf("Player %s (%s) disconnected", player.Username, playerID)

	// Initialize the temp disconnected players map if it doesn't exist
	if g.TempDisconnectedPlayers == nil {
		g.TempDisconnectedPlayers = make(map[string]*shared.Player)
	}

	// Store the player in the temporary map
	g.TempDisconnectedPlayers[playerID] = player

	// Remove from active players but don't discard data yet
	delete(g.Players, playerID)

	// Check if all players are disconnected and if we need cleanup
	allDisconnected := true
	for _, p := range g.Players {
		if p.Connected {
			allDisconnected = false
			break
		}
	}

	needsCleanup := len(g.Players) == 0 && g.Status != 2 && len(g.TempDisconnectedPlayers) == 0

	// Update last activity before releasing lock
	g.lastActivity = time.Now()

	// Release lock before any external calls
	g.Mu.Unlock()

	// Broadcast disconnection message
	g.Messenger.BroadcastMessage([]byte("Player temporarily disconnected: " + playerID))
	g.BroadcastGameState()

	// Start timer to remove the player permanently if they don't reconnect
	time.AfterFunc(time.Duration(PlayerReconnectGracePeriod)*time.Second, func() {
		g.Mu.Lock()

		// Check if the player is still in the temporary map (hasn't reconnected)
		_, stillDisconnected := g.TempDisconnectedPlayers[playerID]
		if !stillDisconnected {
			g.Mu.Unlock()
			return
		}

		log.Printf("Grace period expired for player %s, removing permanently", playerID)
		delete(g.TempDisconnectedPlayers, playerID)

		// Release lock before broadcasting
		g.Mu.Unlock()

		// Broadcast final removal
		g.Messenger.BroadcastMessage([]byte("Player permanently removed: " + playerID))
		g.BroadcastGameState()
	})

	// If we need to clean up the game (no players left)
	if needsCleanup && g.lifecycle != nil {
		log.Println("All players have left the game, initiating cleanup")
		g.lifecycle.OnGameEnded(g.ID)
	}

	if allDisconnected {
		log.Println("All players have disconnected from game:", g.ID)
	}
}

// HandleReconnect checks if a player was temporarily disconnected and restores them
func (g *Game) HandleReconnect(playerID string) bool {
	g.Mu.Lock()

	// Check if player exists in temp disconnected players
	player, exists := g.TempDisconnectedPlayers[playerID]
	if !exists {
		g.Mu.Unlock()
		return false
	}

	log.Printf("Player %s (%s) is reconnecting within grace period", player.Username, playerID)

	// Restore player to active players
	player.Connected = true
	g.Players[playerID] = player

	// Remove from temp storage
	delete(g.TempDisconnectedPlayers, playerID)

	// Release lock before broadcasting
	g.Mu.Unlock()

	// Broadcast reconnection message
	g.Messenger.BroadcastMessage([]byte("Player reconnected: " + playerID))
	g.BroadcastGameState()

	return true
}

// CheckTempDisconnectedPlayer checks if a player is in the temporary disconnected players map
func (g *Game) CheckTempDisconnectedPlayer(playerID string) bool {
	g.Mu.Lock()
	defer g.Mu.Unlock()

	// Initialize map if it doesn't exist
	if g.TempDisconnectedPlayers == nil {
		return false
	}

	_, exists := g.TempDisconnectedPlayers[playerID]
	return exists
}
