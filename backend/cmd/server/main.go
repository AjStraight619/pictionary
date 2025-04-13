package main

import (
	"log"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
)

func main() {
	cfg := config.GetConfig()

	// Initialize the database
	if err := app.InitDB(); err != nil {
		log.Printf("Database initialization failed: %v", err)
	}

	// Initialize Echo with its built-in health check endpoint
	e := app.InitEcho(cfg)

	// Set up game server and routes
	gameServer := server.NewGameServer()
	handlers.RegisterRoutes(e, gameServer)
	app.SetupShutdown(e, gameServer)

	// Start the server (with Echo's built-in health check)
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Printf("Server error: %v", err)
	}
}
