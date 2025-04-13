package main

import (
	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
)

func main() {
	cfg := config.GetConfig()
	gameServer := server.NewGameServer()

	e := app.InitEcho(cfg)

	app.InitDB()

	handlers.RegisterRoutes(e, gameServer)

	app.SetupShutdown(e, gameServer)

	// Start the server
	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
