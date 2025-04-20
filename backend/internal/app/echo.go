package app

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/session"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

// Global session manager
var SessionManager *session.Manager

// InitEcho initializes and configures the Echo web framework
func InitEcho(cfg *config.Config) *echo.Echo {
	e := echo.New()

	// Basic health check should be first and not depend on any initialization
	// This is critical for Railway deployment
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})

	// Register all other middleware and routes after health check
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Only try to connect to Redis if not already in a failing state
	if os.Getenv("SKIP_REDIS") != "true" {
		// Initialize session manager
		redisURL := cfg.Redis.URL
		log.Printf("[REDIS] Attempting to connect to Redis with URL: %s", redisURL)

		if redisURL == "" {
			log.Printf("[REDIS] ERROR: Redis URL is empty! Sessions will be disabled")
			return e
		}

		var err error
		SessionManager, err = session.NewManager(context.Background(), redisURL)
		if err != nil {
			log.Printf("[REDIS] Connection failed: %v - sessions will be disabled", err)
		} else {
			log.Printf("[REDIS] Connection successful - sessions enabled")
			e.Use(session.Middleware(SessionManager))
		}
	} else {
		log.Printf("[REDIS] Skipping Redis connection as SKIP_REDIS=true")
	}

	// Add environment to context
	e.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Set("environment", cfg.Environment)
			return next(c)
		}
	})

	// Configure CORS
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		AllowCredentials: true,
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		MaxAge:           86400, // 24 hours for preflight request caching
	}))

	return e
}
