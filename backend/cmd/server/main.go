package main

import (
	"log"
	"net/http"
	"os"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/labstack/echo/v4"
)

func main() {
	log.Printf("Starting server with environment: %s", os.Getenv("RAILWAY_ENVIRONMENT_NAME"))
	log.Printf("Port: %s", os.Getenv("PORT"))

	// Set the port explicitly if not set
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
		log.Printf("PORT not set, defaulting to 8080")
	}

	cfg := config.GetConfig()
	log.Printf("Config: Environment=%s, Port=%s", cfg.Environment, cfg.Port)

	// Basic server setup
	gameServer := server.NewGameServer()
	log.Printf("Game server initialized")

	e := app.InitEcho(cfg)
	log.Printf("Echo initialized")

	// Register health check route directly in main as a fallback
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})
	log.Printf("Health check route registered")

	// Continue with remaining initialization
	app.InitDB()
	log.Printf("Database initialized")

	handlers.RegisterRoutes(e, gameServer)
	log.Printf("Routes registered")

	app.SetupShutdown(e, gameServer)
	log.Printf("Graceful shutdown setup complete")

	// Start the server
	log.Printf("Starting server on port %s", cfg.Port)
	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
