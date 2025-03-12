package handlers

import (
	"log"

	g "github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/labstack/echo/v4"
)

func CreateGameStateHandler(c echo.Context, games *g.Games) error {
	gameID := c.Param("id")
	log.Printf("CreateGameStateHandler: received gameID: %s", gameID)

	game, exists := games.GetGameByID(gameID)

	if !exists {
		return c.JSON(404, map[string]string{"error": "Game not found"})
	}

	state := game.GetGameState()

	return c.JSON(200, map[string]interface{}{"gameState": state})

}
