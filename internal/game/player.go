package game

import (
	"log"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

func NewPlayer(id, username string, isHost bool) *shared.Player {
	return &shared.Player{
		ID:        id,
		Username:  username,
		IsHost:    isHost,
		Score:     0,
		Color:     "",
		Ready:     false,
		Pending:   false,
		Connected: false,
		IsDrawing: false,
	}
}

func (g *Game) AddPlayer(player *shared.Player) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	if _, exists := g.Players[player.ID]; exists {
		return
	}
	// Assign a unique color from the available pool.
	if len(g.AvailableColors) > 0 {
		player.Color = g.AvailableColors[0]
		g.AvailableColors = g.AvailableColors[1:]
	} else {
		// No unique colors left, fallback to a default value or error.
		player.Color = "#FFFFFF" // or handle this case as needed.
	}
	g.Players[player.ID] = player
	g.PlayerOrder = append(g.PlayerOrder, player.ID)
	log.Printf("AddPlayer: added player %s with color %s; current PlayerOrder: %+v", player.ID, player.Color, g.PlayerOrder)

}

func (g *Game) RemovePlayer(playerID string) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	if player, ok := g.Players[playerID]; ok {
		// Return the player's color back to the pool.
		g.AvailableColors = append(g.AvailableColors, player.Color)
		delete(g.Players, playerID)
	}

	for i, id := range g.PlayerOrder {
		if id == playerID {
			g.PlayerOrder = append(g.PlayerOrder[:i], g.PlayerOrder[i+1:]...)
			break
		}
	}
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
