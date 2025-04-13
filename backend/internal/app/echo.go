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

	// Basic health check should be first
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Only try to connect to Redis if not already in a failing state
	if os.Getenv("SKIP_REDIS") != "true" {
		// Initialize session manager
		var err error
		SessionManager, err = session.NewManager(context.Background(), cfg.Redis.URL)
		if err != nil {
			log.Printf("ERROR: Failed to connect to Redis at %s: %v", cfg.Redis.URL, err)

			if cfg.Environment == "production" {
				log.Printf("Redis connection failed in production - sessions will be disabled")
			} else {
				log.Printf("Redis connection failed in development, install with:")
				log.Printf("brew install redis && brew services start redis   (macOS)")
				log.Printf("sudo apt-get install redis-server              (Ubuntu/Debian)")
				log.Printf("docker run --name redis -p 6379:6379 -d redis  (Docker)")
			}
		} else {
			log.Printf("Successfully connected to Redis at %s", cfg.Redis.URL)
			e.Use(session.Middleware(SessionManager))
		}
	} else {
		log.Printf("Skipping Redis connection as requested")
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
