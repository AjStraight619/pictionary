package handlers

import (
	"fmt"
	"net/http"

	"github.com/Ajstraight619/pictionary-server/internal/game"
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

func CreateTestPlayers(numPlayers int, game *game.Game) []*shared.Player {
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

	for _, p := range CreateTestPlayers(numPlayers, game) {
		game.AddPlayer(p)
	}

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

	playerID := uuid.New().String()
	player := game.NewPlayer(playerID, req.Username, false)
	player.Pending = true
	game.AddPlayer(player)

	return c.JSON(http.StatusOK, map[string]string{
		"gameID":   req.GameID,
		"playerID": playerID,
	})
}
