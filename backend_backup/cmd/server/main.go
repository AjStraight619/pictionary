package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/config"
	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/logger"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Get application config
	appCfg := config.GetAppConfig()

	// Initialize logger
	logCfg := config.NewLogConfig()
	log, err := logCfg.BuildLogger()
	if err != nil {
		panic("failed to initialize logger: " + err.Error())
	}
	defer log.Sync()
	logger.InitLogger(log.Sugar())

	// Initialize game server
	gameServer := server.NewGameServer()

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	db.InitDB("data/game.db")

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: appCfg.AllowedOrigins,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	}))

	handlers.RegisterRoutes(e, gameServer)

	// Update logger usage in shutdown handler
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := gameServer.Shutdown(ctx); err != nil {
			logger.Log.Error("Error shutting down game server",
				"error", err,
			)
		}

		if err := e.Shutdown(ctx); err != nil {
			logger.Log.Error("Error shutting down HTTP server",
				"error", err,
			)
		}
	}()

	logger.Log.Info("Starting server",
		"port", appCfg.Port,
		"environment", appCfg.Environment,
	)

	if err := e.Start(":" + appCfg.Port); err != nil && err != http.ErrServerClosed {
		logger.Log.Fatal("Server startup failed",
			"error", err,
		)
	}
}
