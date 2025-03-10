package handlers

import (
	"net/http"

	g "github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/ws"
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, hubs *ws.Hubs, games *g.Games) {
	e.POST("/game/create", func(c echo.Context) error {
		return CreateGameHandler(c, hubs, games)
	})

	e.POST("/game/join", func(c echo.Context) error {
		return JoinGameHandler(c, hubs, games)
	})

	e.GET("/game/:id", func(c echo.Context) error {
		return ws.ServeWs(c, hubs, games)
	})

	e.GET("/game/state/:id", func(c echo.Context) error {
		return CreateGameStateHandler(c, games)
	})

	// You can add additional routes here in the future
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})
}
