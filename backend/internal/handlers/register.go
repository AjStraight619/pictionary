package handlers

import (
	"net/http"

	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/Ajstraight619/pictionary-server/internal/user"
	"github.com/labstack/echo/v4"
)

func RegisterRoutes(e *echo.Echo, server *server.GameServer) {
	e.POST("/game/create", func(c echo.Context) error {
		return CreateGameHandler(c, server)
	})

	e.POST("/game/join", func(c echo.Context) error {
		return JoinGameHandler(c, server)
	})

	e.GET("/game/:id", func(c echo.Context) error {
		return ServeWs(c, server)
	})

	userService := user.NewService()
	RegisterAuthRoutes(e, userService)

	// Root path for Railway health check
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// Health check endpoint
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})
}
