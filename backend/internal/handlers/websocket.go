package handlers

import (
	"log"
	"net/http"
	"time"

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
	log.Printf("ServeWs: received gameID: %s", gameID)

	game, exists := server.GetGame(gameID)
	if !exists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Game not found"})
	}

	hub, exists := server.GetHub(gameID)
	if !exists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Hub not found"})
	}

	// Get player info from session or query params
	playerID, username, _ := GetPlayerIDFromSession(c, gameID)

	if playerID == "" || username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "PlayerID and Username are required"})
	}

	// Upgrade connection to WebSocket
	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Unable to upgrade connection"})
	}

	// Check if player was removed from this game
	isRemoved, err := HandleRemovedPlayer(c, game, playerID, gameID)
	if isRemoved {
		conn.Close()
		return err
	}

	// Update the player's connection status
	player := game.GetPlayerByID(playerID)

	// Handle reconnection if needed
	if player == nil {
		_, isReconnecting := HandleReconnection(c, game, playerID, username, gameID)
		if isReconnecting {
			player = game.GetPlayerByID(playerID)
		}
	}

	// Ensure player exists
	if player == nil {
		conn.Close()
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Player not found"})
	}

	// Setup WebSocket client
	player.Pending = false
	player.Connected = true
	player.Client = ws.NewClient(hub, conn, playerID)

	if wsClient, ok := player.Client.(*ws.Client); ok {
		hub.Register <- wsClient
	} else {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
	}

	// Start listening for messages
	go player.Client.Write()
	go player.Client.Read()

	// Notify others that a player has joined
	msgType := "playerJoined"
	payload := map[string]interface{}{
		"player": player,
	}

	b, err := utils.CreateMessage(msgType, payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
	}

	hub.Broadcast <- b

	// Broadcast game state after a short delay
	time.AfterFunc(200*time.Millisecond, func() {
		game.BroadcastGameState()
	})

	return nil
}
