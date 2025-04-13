package main

import (
	"log"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
)

func main() {
	// Get config first to ensure environment variables are loaded
	cfg := config.GetConfig()

	// Start initializing Echo FIRST to handle health checks immediately
	e := app.InitEcho(cfg)

	// Set up game server and routes
	gameServer := server.NewGameServer()
	handlers.RegisterRoutes(e, gameServer)

	// Start database initialization in the background to avoid delaying health check
	go func() {
		if err := app.InitDB(); err != nil {
			log.Printf("Database initialization failed: %v", err)
		}
		log.Println("Database initialization complete")
	}()

	// Setup shutdown handlers
	app.SetupShutdown(e, gameServer)

	// Start the server
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Printf("Server error: %v", err)
	}
}
