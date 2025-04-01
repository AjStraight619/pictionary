package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	cfg := config.GetConfig()
	gameServer := server.NewGameServer()

	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Ensure data directory exists
	dataDir := "data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Warning: Could not create data directory: %v", err)
	}

	// Use environment variable for database path if provided
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = filepath.Join(dataDir, "game.db")
	}
	log.Printf("Using database path: %s", dbPath)

	// Initialize database connection
	db.InitDB(dbPath)

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		MaxAge:           86400, // 24 hours for preflight request caching
	}))

	handlers.RegisterRoutes(e, gameServer)

	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := gameServer.Shutdown(ctx); err != nil {
			e.Logger.Fatal(err)
		}

		if err := e.Shutdown(ctx); err != nil {
			e.Logger.Fatal(err)
		}
	}()

	e.Logger.Fatal(e.Start(":" + cfg.Port))
}
