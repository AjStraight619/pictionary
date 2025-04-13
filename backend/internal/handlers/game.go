package handlers

import (
	"fmt"
	"net/http"

	g "github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type CreateGameRequest struct {
	Username string             `json:"username"`
	Options  shared.GameOptions `json:"options"`
}

type JoinGameRequest struct {
	Username string `json:"username"`
	GameID   string `json:"gameID"`
}

var numPlayers = 2

func CreateTestPlayers(numPlayers int, game *g.Game) []*shared.Player {
	players := make([]*shared.Player, numPlayers)

	for i := range numPlayers {
		players[i] = game.NewPlayer(uuid.New().String(), fmt.Sprintf("player %d", i), false)
		players[i].Ready = true
	}
	return players
}

func CreateGameHandler(c echo.Context, server *server.GameServer) error {
	var req CreateGameRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}
	if req.Username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username is required"})
	}

	playerID := uuid.New().String()
	gameID := uuid.New().String()

	// Create game using GameServer
	if err := server.CreateGame(gameID, req.Options); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create game"})
	}

	// Get the created game
	game, _ := server.GetGame(gameID)

	// Add the host player
	player := game.NewPlayer(playerID, req.Username, true)
	game.AddPlayer(player)
	player.Pending = true

	env := c.Get("environment")
	if env == "development" || env == "" {
		for _, p := range CreateTestPlayers(numPlayers, game) {
			game.AddPlayer(p)
		}
	}

	// Create session for the player
	UpdateSessionWithNewPlayer(c, playerID, req.Username, gameID)

	return c.JSON(http.StatusOK, map[string]string{
		"gameID":   gameID,
		"playerID": playerID,
	})
}

func JoinGameHandler(c echo.Context, server *server.GameServer) error {
	var req JoinGameRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	game, exists := server.GetGame(req.GameID)
	if !exists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Game not found"})
	}

	// Get player info from session or query params
	playerID, _, _ := GetPlayerIDFromSession(c, req.GameID)

	// Check if player was removed from this game
	if playerID != "" {
		isRemoved, err := HandleRemovedPlayer(c, game, playerID, req.GameID)
		if isRemoved {
			return err
		}

		// Try to reconnect the player
		playerID, isReconnecting := HandleReconnection(c, game, playerID, req.Username, req.GameID)

		// If reconnecting, allow them to join regardless of game state
		if isReconnecting {
			return c.JSON(http.StatusOK, map[string]string{
				"gameID":   req.GameID,
				"playerID": playerID,
			})
		}
	}

	// If game is in progress and not reconnecting, reject
	if game.Status == g.InProgress {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Game is already in progress"})
	}

	if req.Username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username is required"})
	}

	// Generate a fresh player ID to avoid collision with removed players
	newPlayerID := uuid.New().String()
	player := game.NewPlayer(newPlayerID, req.Username, false)
	player.Pending = true
	game.AddPlayer(player)

	// Update or create session
	UpdateSessionWithNewPlayer(c, newPlayerID, req.Username, req.GameID)

	return c.JSON(http.StatusOK, map[string]string{
		"gameID":   req.GameID,
		"playerID": newPlayerID,
	})
}
