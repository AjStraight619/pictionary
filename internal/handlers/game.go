package handlers

import (
	"fmt"
	"log"
	"net/http"

	g "github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/ws"
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

var numPlayers = 4

func CreateTestPlayers(numPlayers int) []*shared.Player {
	players := make([]*shared.Player, numPlayers)

	for i := 0; i < numPlayers; i++ {
		players[i] = g.NewPlayer(uuid.New().String(), fmt.Sprintf("player %d", i), false)
	}
	return players
}

func CreateGameHandler(c echo.Context, hubs *ws.Hubs, games *g.Games) error {
	var req CreateGameRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}
	if req.Username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username is required"})
	}

	playerID := uuid.New().String()
	gameID := uuid.New().String()

	log.Printf("CreateGameHandler: generated playerID: %s", playerID)
	log.Printf("CreateGameHandler: generated gameID: %s", gameID)

	hub := ws.NewHub()
	hubs.AddHub(gameID, hub)

	game := g.NewGame(gameID, req.Options, hub)
	// Add game to the games collection so ServeWs can find it.
	games.AddGame(game)
	game.InitGameEvents()

	hub.OnDisconnect = game.HandleDisconnect
	player := g.NewPlayer(playerID, req.Username, true)
	game.AddPlayer(player)

	player.Pending = true

	go hub.Run()
	go game.Run()

	for _, p := range CreateTestPlayers(numPlayers) {
		game.AddPlayer(p)
	}
	return c.JSON(http.StatusOK, map[string]string{"gameID": gameID, "playerID": playerID})
}

func JoinGameHandler(c echo.Context, hubs *ws.Hubs, games *g.Games) error {
	var req JoinGameRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
	}

	if req.Username == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username is required"})
	}

	if req.GameID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Game ID is required"})
	}

	playerID := uuid.New().String()
	gameID := req.GameID

	_, exists := hubs.GetHub(gameID)

	game, exists := games.GetGameByID(gameID)

	if !exists {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Game not found"})
	}

	player := g.NewPlayer(playerID, req.Username, false)
	player.Pending = true
	game.AddPlayer(player)

	return c.JSON(http.StatusOK, map[string]string{"gameID": gameID, "playerID": playerID})

}
