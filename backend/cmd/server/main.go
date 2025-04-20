package main

import (
	"log"
	"os"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/Ajstraight619/pictionary-server/internal/user"
)

func main() {
	// Get config first to ensure environment variables are loaded
	cfg := config.GetConfig()

	// Start initializing Echo FIRST to handle health checks immediately
	e := app.InitEcho(cfg)

	// Initialize database directly
	if err := db.InitDB(); err != nil {
		log.Printf("Database initialization failed: %v", err)
		os.Exit(1) // Exit the application if DB initialization fails
	}

	// Verify that DB is not nil
	if db.DB == nil {
		log.Printf("Database is nil after successful initialization - this should never happen")
		os.Exit(1)
	}

	log.Println("Database initialization complete")

	// Create all required services first (after DB is initialized)
	userService := user.NewService()

	// Set up game server
	gameServer := server.NewGameServer()

	// Register all routes after services are created
	handlers.RegisterRoutes(e, gameServer)
	handlers.RegisterUserRoutes(e, userService)

	// Setup shutdown handlers
	app.SetupShutdown(e, gameServer)

	// Start the server
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Printf("Server error: %v", err)
	}
}
