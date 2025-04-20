package main

import (
	"log"
	"net/http"
	"time"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/Ajstraight619/pictionary-server/internal/user"
	"github.com/labstack/echo/v4"
)

// Health check handler that doesn't depend on any initialization
func healthCheckHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "healthy",
	})
}

func main() {
	// Get config first to ensure environment variables are loaded
	cfg := config.GetConfig()

	e := app.InitEcho(cfg)

	e.GET("/health", healthCheckHandler)
	e.GET("/", healthCheckHandler)

	go func() {
		time.Sleep(500 * time.Millisecond)

		// Initialize database
		log.Println("Initializing database...")
		if err := db.InitDB(); err != nil {
			log.Printf("Database initialization failed: %v", err)
			// Don't exit - just log and continue with limited functionality
			return
		}

		// Verify that DB is not nil
		if db.DB == nil {
			log.Printf("Database is nil after initialization - functionality will be limited")
			return
		}

		log.Println("Database initialization complete")

		// Create all required services
		userService := user.NewService()

		// Set up game server
		gameServer := server.NewGameServer()

		// Register all routes after services are created
		handlers.RegisterRoutes(e, gameServer)
		handlers.RegisterUserRoutes(e, userService)

		// Setup shutdown handlers
		app.SetupShutdown(e, gameServer)

		log.Println("All services and routes initialized successfully")
	}()

	// Start the server - this must be outside the goroutine
	log.Printf("Starting server on port %s", cfg.Port)
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Printf("Server error: %v", err)
	}
}
