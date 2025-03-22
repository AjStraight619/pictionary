package game

import (
	"log"

	"github.com/Ajstraight619/pictionary-server/internal/errors"
	"github.com/Ajstraight619/pictionary-server/internal/logger"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
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

func (g *Game) AddPlayer(player *shared.Player) error {
	g.Mu.Lock()
	defer g.Mu.Unlock()

	if _, exists := g.Players[player.ID]; exists {
		err := errors.NewPlayerError(
			errors.ErrPlayerExists,
			"player already exists in game",
			g.ID,
			player.ID,
		)
		logger.GameError(err)
		return err
	}

	if len(g.Players) >= g.Options.MaxPlayers {
		err := errors.NewGameError(
			errors.ErrGameFull,
			"game has reached maximum players",
			g.ID,
		)
		logger.GameError(err)
		return err
	}

	// Assign a unique color from the available pool
	if len(g.AvailableColors) > 0 {
		player.Color = g.AvailableColors[0]
		g.AvailableColors = g.AvailableColors[1:]
	} else {
		player.Color = "#FFFFFF" // fallback color
	}

	g.Players[player.ID] = player
	g.PlayerOrder = append(g.PlayerOrder, player.ID)

	logger.GameEvent(g.ID, "player_joined",
		"playerID", player.ID,
		"playerCount", len(g.Players),
		"isHost", player.IsHost,
		"color", player.Color,
	)

	return nil
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
