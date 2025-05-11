package main

import (
	"net/http"
	"os"
	"time"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
	"github.com/Ajstraight619/pictionary-server/internal/user"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

func healthCheckHandler(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{
		"status": "healthy",
	})
}

func main() {
	cfg := config.GetConfig()
	logger := config.GetLogger()
	defer logger.Sync()

	// Verify Redis URL
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		logger.Warn("REDIS_URL environment variable is not set; sessions will not work")
	} else {
		// log only a prefix for security
		logger.Info("REDIS_URL is set",
			zap.String("prefix", redisURL[:10]+"..."),
		)
	}

	// Initialize Echo early for health checks
	e := app.InitEcho(cfg)
	e.GET("/health", healthCheckHandler)
	e.GET("/", healthCheckHandler)

	go func() {
		time.Sleep(500 * time.Millisecond)

		// Initialize database
		logger.Info("Initializing database")
		if err := db.InitDB(); err != nil {
			logger.Error("Database initialization failed", zap.Error(err))
			return
		}
		if db.DB == nil {
			logger.Warn("Database is nil after initialization; functionality will be limited")
			return
		}
		logger.Info("Database initialization complete")

		// Create services and game server
		userService := user.NewService(logger.Named("user"))
		gameServer := server.NewGameServer(logger.Named("game"))

		// Register routes
		handlers.RegisterRoutes(e, gameServer)
		handlers.RegisterUserRoutes(e, userService)

		app.SetupShutdown(e, gameServer)

		logger.Info("All services and routes initialized successfully")
	}()

	// Start the HTTP server
	logger.Info("Starting server", zap.String("port", cfg.Port))
	if err := e.Start(":" + cfg.Port); err != nil {
		// echo returns ErrServerClosed on graceful shutdown; only log real errors
		if err != http.ErrServerClosed {
			logger.Error("Server error", zap.Error(err))
		} else {
			logger.Info("Server shut down gracefully")
		}
	}
}
