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
	player, exists := g.Players[playerID]
	if !exists {
		g.Mu.Unlock()
		return
	}

	player.Connected = false
	log.Printf("HandleDisconnect: Player %s (%s) disconnected", player.Username, playerID)

	// Check if player was removed by host - don't store in temp disconnected
	if _, isRemoved := g.RemovedPlayers[playerID]; isRemoved {
		log.Printf("HandleDisconnect: Player %s was previously removed by host, not storing for reconnection", playerID)
		delete(g.Players, playerID)
		g.Mu.Unlock()

		// Game state update is handled by RemovePlayer, which is called separately
		return
	}

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

		log.Printf("HandleDisconnect: Grace period expired for player %s, removing permanently", playerID)
		delete(g.TempDisconnectedPlayers, playerID)

		// Release lock before broadcasting
		g.Mu.Unlock()

		// Broadcast final removal
		g.Messenger.BroadcastMessage([]byte("Player permanently removed: " + playerID))
		g.BroadcastGameState()
	})

	// If we need to clean up the game (no players left)
	if needsCleanup && g.lifecycle != nil {
		log.Printf("HandleDisconnect: All players have left the game, initiating cleanup")
		g.lifecycle.OnGameEnded(g.ID)
	}

	if allDisconnected {
		log.Printf("HandleDisconnect: All players have disconnected from game: %s", g.ID)
	}
}

func (g *Game) HandleReconnect(playerID string) bool {
	g.Mu.Lock()

	// First check if player was removed by host
	if _, isRemoved := g.RemovedPlayers[playerID]; isRemoved {
		log.Printf("HandleReconnect: Rejecting reconnection attempt from removed player %s", playerID)
		g.Mu.Unlock()

		// Notify that this player was removed and cannot rejoin
		g.Messenger.BroadcastMessage([]byte("Removed player attempted to reconnect: " + playerID))
		return false
	}

	player, exists := g.TempDisconnectedPlayers[playerID]
	if !exists {
		log.Printf("HandleReconnect: Player %s not found in temporary disconnected players", playerID)
		g.Mu.Unlock()
		return false
	}

	log.Printf("HandleReconnect: Player %s (%s) is reconnecting within grace period", player.Username, playerID)

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
