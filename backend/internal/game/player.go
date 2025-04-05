package game

import (
	"errors"
	"log"
	"time"

	"slices"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

var defaultColors = []string{
	"#FF0000",
	"#00FF00",
	"#0000FF",
	"#FFFF00",
	"#FF00FF",
	"#00FFFF",
	"#FFA500",
	"#800080",
}

func (g *Game) NewPlayer(id, username string, isHost bool) *shared.Player {
	return &shared.Player{
		ID:        id,
		JoinedAt:  time.Now(),
		Username:  username,
		IsHost:    isHost,
		Score:     0,
		Color:     "",
		Ready:     false,
		Pending:   false,
		Connected: false,
		IsDrawing: false,
		Removed:   false,
	}
}

func (g *Game) AddPlayer(player *shared.Player) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	if _, exists := g.Players[player.ID]; exists {
		return
	}
	if len(g.AvailableColors) > 0 {
		player.Color = g.AvailableColors[0]
		g.AvailableColors = g.AvailableColors[1:]
	} else {
		player.Color = "#FFFFFF"
	}
	g.Players[player.ID] = player
	g.PlayerOrder = append(g.PlayerOrder, player.ID)
	log.Printf("AddPlayer: added player %s with color %s; current PlayerOrder: %+v", player.ID, player.Color, g.PlayerOrder)

}

func (g *Game) RemovePlayer(playerID string) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	if player, ok := g.Players[playerID]; ok {
		g.AvailableColors = append(g.AvailableColors, player.Color)
		delete(g.Players, playerID)

		var msgType string
		if player.Removed {
			msgType = "playerRemoved"
		} else {
			msgType = "playerLeft"
		}

		msg, err := utils.CreateMessage(msgType, map[string]interface{}{
			"player": player,
		})
		if err != nil {
			log.Printf("RemovePlayer: error creating message: %v", err)
		}

		g.Messenger.BroadcastMessage(msg)
	}

	for i, id := range g.PlayerOrder {
		if id == playerID {
			g.PlayerOrder = slices.Delete(g.PlayerOrder, i, i+1)
			break
		}
	}
}

func (g *Game) RemovePlayerByHost(playerID string, hostID string) error {
	// Verify host permissions
	g.Mu.RLock()
	hostPlayer, hostExists := g.Players[hostID]
	if !hostExists || !hostPlayer.IsHost {
		g.Mu.RUnlock()
		log.Printf("RemovePlayerByHost: Unauthorized removal attempt by non-host player %s", hostID)
		return errors.New("only the host can remove players")
	}
	g.Mu.RUnlock()

	// Get player and add to removed players set
	g.Mu.Lock()
	player, exists := g.Players[playerID]

	// Mark player as removed in central set
	g.RemovedPlayers[playerID] = true

	if exists {
		log.Printf("RemovePlayerByHost: Marking player %s (%s) as removed by host %s", player.Username, playerID, hostID)

		// Get player info for notification before possibly removing
		playerInfo := *player

		// Broadcast player removed notification before we close the connection
		removedMsg, _ := utils.CreateMessage("playerRemoved", map[string]interface{}{
			"player": playerInfo,
		})
		g.Mu.Unlock()
		g.Messenger.BroadcastMessage(removedMsg)

		// Reacquire lock for further operations
		g.Mu.Lock()

		// Close their connection if active
		if player.Client != nil {
			log.Printf("RemovePlayerByHost: Closing connection for removed player %s", playerID)
			player.Client.Close() // This will trigger HandleDisconnect
		} else {
			// If not connected, just remove from game directly
			log.Printf("RemovePlayerByHost: Player %s not active, removing directly", playerID)
			g.RemovePlayer(playerID)
		}
	} else {
		log.Printf("RemovePlayerByHost: Player %s not found in active players", playerID)

		// Check if in temporary storage and remove them
		if _, inTempStorage := g.TempDisconnectedPlayers[playerID]; inTempStorage {
			log.Printf("RemovePlayerByHost: Found player %s in temporary storage, removing", playerID)
			delete(g.TempDisconnectedPlayers, playerID)
		} else {
			log.Printf("RemovePlayerByHost: Player %s not found in game at all", playerID)
		}
		g.Mu.Unlock()
	}

	// Make sure game state is updated
	g.BroadcastGameState()

	return nil
}

func (g *Game) GetPlayerByID(playerID string) *shared.Player {
	g.Mu.RLock()
	defer g.Mu.RUnlock()
	if player, ok := g.Players[playerID]; ok {
		return player
	}
	log.Printf("GetPlayerByID: player with ID %s not found. Current players: %+v", playerID, g.PlayerOrder)
	return nil
}

func (g *Game) getPlayerColor(playerID string) string {
	if player, exists := g.Players[playerID]; exists {
		return player.Color
	}
	return "#FFFFFF"
}

func (g *Game) CheckForHost() bool {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	for _, player := range g.Players {
		if player.IsHost {
			return true
		}
	}
	return false
}

func (g *Game) ClearDrawingPlayers() {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	for _, player := range g.Players {
		player.IsDrawing = false
	}
}
