package handlers

import (
	"fmt"
	"net/http"

	"github.com/Ajstraight619/pictionary-server/internal/errors"
	"github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/logger"
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

	for i := 0; i < numPlayers; i++ {
		players[i] = game.NewPlayer(uuid.New().String(), fmt.Sprintf("player %d", i), false)
	}
	return players
}

func CreateGameHandler(c echo.Context, server *server.GameServer) error {
	var req CreateGameRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("Failed to bind create game request", "error", err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request format"})
	}

	if req.Username == "" {
		err := errors.NewGameError(
			errors.ErrInvalidMessage,
			"username is required",
			"",
		)
		logger.GameError(err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	playerID := uuid.New().String()
	gameID := uuid.New().String()

	logger.Info("Creating new game",
		"gameID", gameID,
		"playerID", playerID,
		"username", req.Username,
	)

	// Create game using GameServer
	if err := server.CreateGame(gameID, req.Options); err != nil {
		logger.Error("Failed to create game",
			"error", err,
			"gameID", gameID,
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create game"})
	}

	// Get the created game
	game, exists := server.GetGame(gameID)
	if !exists {
		err := errors.NewGameError(
			errors.ErrGameNotFound,
			"newly created game not found",
			gameID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	// Add the host player
	player := game.NewPlayer(playerID, req.Username, true)
	if err := game.AddPlayer(player); err != nil {
		logger.Error("Failed to add host player",
			"error", err,
			"gameID", gameID,
			"playerID", playerID,
		)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	player.Pending = true

	// Add test players
	for _, p := range CreateTestPlayers(numPlayers, game) {
		if err := game.AddPlayer(p); err != nil {
			logger.Error("Failed to add test player",
				"error", err,
				"gameID", gameID,
			)
			// Continue adding other players even if one fails
			continue
		}
	}

	logger.Info("Game created successfully",
		"gameID", gameID,
		"playerID", playerID,
		"playerCount", len(game.Players),
	)

	return c.JSON(http.StatusOK, map[string]string{
		"gameID":   gameID,
		"playerID": playerID,
	})
}

func JoinGameHandler(c echo.Context, server *server.GameServer) error {
	var req JoinGameRequest
	if err := c.Bind(&req); err != nil {
		logger.Error("Failed to bind join game request", "error", err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request format"})
	}

	if req.GameID == "" {
		err := errors.NewGameError(
			errors.ErrInvalidMessage,
			"game ID is required",
			"",
		)
		logger.GameError(err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	if req.Username == "" {
		err := errors.NewGameError(
			errors.ErrInvalidMessage,
			"username is required",
			req.GameID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	game, exists := server.GetGame(req.GameID)
	if !exists {
		err := errors.NewGameError(
			errors.ErrGameNotFound,
			"game not found",
			req.GameID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}

	playerID := uuid.New().String()
	player := game.NewPlayer(playerID, req.Username, false)
	player.Pending = true

	if err := game.AddPlayer(player); err != nil {
		logger.Error("Failed to add player to game",
			"error", err,
			"gameID", req.GameID,
			"playerID", playerID,
		)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	logger.Info("Player joined game successfully",
		"gameID", req.GameID,
		"playerID", playerID,
		"username", req.Username,
	)

	return c.JSON(http.StatusOK, map[string]string{
		"gameID":   req.GameID,
		"playerID": playerID,
	})
}
