package handlers

import (
	"github.com/Ajstraight619/pictionary-server/internal/server"
	// "github.com/Ajstraight619/pictionary-server/internal/user" // No longer creating userService here
	"github.com/labstack/echo/v4"
)

// RegisterRoutes sets up the game-specific routes.
// Auth and user routes are handled by RegisterUserRoutes, called from main.go.
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

	// userService := user.NewService()
	// RegisterAuthRoutes(e, userService)

	// Root path and /health are registered in main.go
	// e.GET("/", func(c echo.Context) error {
	// 	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	// })

	// e.GET("/health", func(c echo.Context) error {
	// 	return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	// })
}
