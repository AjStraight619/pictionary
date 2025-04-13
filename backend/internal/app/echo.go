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
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Add health check endpoint directly in Echo init
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "healthy"})
	})

	// Initialize session manager - Redis is required
	var err error
	SessionManager, err = session.NewManager(context.Background(), cfg.Redis.URL)
	if err != nil {
		log.Printf("ERROR: Failed to connect to Redis at %s: %v", cfg.Redis.URL, err)
		log.Printf("Redis is required for the application to function correctly.")

		if cfg.Environment == "production" {
			log.Printf("CRITICAL ERROR: Redis connection failed in production environment")
			log.Printf("The application will continue to run WITHOUT Redis for debugging purposes")
			// Don't exit, let it continue to debug the issue
		} else {
			log.Printf("In development mode - please install Redis and restart the server")
			log.Printf("brew install redis && brew services start redis   (macOS)")
			log.Printf("sudo apt-get install redis-server              (Ubuntu/Debian)")
			log.Printf("docker run --name redis -p 6379:6379 -d redis  (Docker)")
			os.Exit(1)
		}
	} else {
		log.Printf("Successfully connected to Redis at %s", cfg.Redis.URL)
		// Add session middleware
		e.Use(session.Middleware(SessionManager))
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
