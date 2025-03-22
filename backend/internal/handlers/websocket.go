package handlers

import (
	"net/http"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/errors"
	"github.com/Ajstraight619/pictionary-server/internal/logger"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
	"github.com/Ajstraight619/pictionary-server/internal/ws"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func ServeWs(c echo.Context, server *server.GameServer) error {
	gameID := c.Param("id")
	logger.Info("WebSocket connection request",
		"gameID", gameID,
		"path", c.Path(),
		"method", c.Request().Method,
	)

	game, exists := server.GetGame(gameID)
	if !exists {
		err := errors.NewGameError(
			errors.ErrGameNotFound,
			"game not found",
			gameID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}

	hub, exists := server.GetHub(gameID)
	if !exists {
		err := errors.NewGameError(
			errors.ErrGameNotFound,
			"hub not found",
			gameID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}

	playerID := c.QueryParam("playerID")
	username := c.QueryParam("username")

	if playerID == "" || username == "" {
		err := errors.NewGameError(
			errors.ErrInvalidMessage,
			"playerID and username are required",
			gameID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		wsErr := errors.NewPlayerError(
			errors.ErrConnectionFailed,
			"unable to upgrade connection",
			gameID,
			playerID,
		)
		logger.GameError(wsErr)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": wsErr.Error()})
	}

	player := game.GetPlayerByID(playerID)
	if player == nil {
		err := errors.NewPlayerError(
			errors.ErrPlayerNotFound,
			"player not found",
			gameID,
			playerID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
	}

	player.Pending = false
	player.Connected = true
	player.Client = ws.NewClient(hub, conn, playerID)

	if wsClient, ok := player.Client.(*ws.Client); ok {
		hub.Register <- wsClient
		logger.GameEvent(gameID, "player_connected",
			"playerID", playerID,
			"username", username,
		)
	} else {
		err := errors.NewPlayerError(
			errors.ErrConnectionFailed,
			"failed to create websocket client",
			gameID,
			playerID,
		)
		logger.GameError(err)
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	go player.Client.Write()
	go player.Client.Read()

	// Broadcast player joined message
	msgType := "playerJoined"
	payload := map[string]interface{}{
		"player": player,
	}

	b, err := utils.CreateMessage(msgType, payload)
	if err != nil {
		logger.Error("Failed to create player joined message",
			"error", err,
			"gameID", gameID,
			"playerID", playerID,
		)
	} else {
		hub.Broadcast <- b
	}

	// Update game state
	time.AfterFunc(200*time.Millisecond, func() {
		logger.Debug("Broadcasting game state after player join",
			"gameID", gameID,
			"playerCount", len(game.Players),
		)
		game.BroadcastGameState()
	})

	return nil
}
