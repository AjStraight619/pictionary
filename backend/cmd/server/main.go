package main

import (
	"log"
	"os"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
)

func main() {
	log.Printf("Starting server with environment: %s", os.Getenv("RAILWAY_ENVIRONMENT_NAME"))
	log.Printf("Port: %s", os.Getenv("PORT"))

	cfg := config.GetConfig()
	log.Printf("Config: Environment=%s, Port=%s", cfg.Environment, cfg.Port)

	gameServer := server.NewGameServer()
	log.Printf("Game server initialized")

	e := app.InitEcho(cfg)
	log.Printf("Echo initialized")

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
