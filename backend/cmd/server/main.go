package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
)

// Simple health check handler that doesn't depend on any initialization
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

func main() {
	// Debug startup issues
	fmt.Println("==== SERVER STARTING ====")
	fmt.Println("Environment:", os.Getenv("RAILWAY_ENVIRONMENT_NAME"))
	fmt.Println("Port:", os.Getenv("PORT"))
	fmt.Println("CGO_ENABLED:", os.Getenv("CGO_ENABLED"))

	// Set the port explicitly if not set
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
		log.Printf("PORT not set, defaulting to 8080")
	}

	// Start a minimal health check server immediately on a different port
	// Railway requires the health check to respond on the main port
	healthPort := os.Getenv("PORT")
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthCheckHandler)

	// Start health check server in a goroutine
	go func() {
		server := &http.Server{
			Addr:    ":" + healthPort,
			Handler: mux,
		}

		log.Printf("Starting health check server on port %s", healthPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Health check server error: %v", err)
		}
	}()

	// Give health check server time to start
	time.Sleep(1 * time.Second)

	// Continue with normal initialization
	log.Printf("Beginning main server initialization")

	cfg := config.GetConfig()
	log.Printf("Config: Environment=%s, Port=%s", cfg.Environment, cfg.Port)

	// Initialize the database, but continue even if it fails
	err := app.InitDB()
	if err != nil {
		log.Printf("WARNING: Database initialization failed: %v", err)
		log.Printf("Continuing without database functionality")
	} else {
		log.Printf("Database initialized successfully")
	}

	// Initialize Echo server
	e := app.InitEcho(cfg)

	// Create game server
	gameServer := server.NewGameServer()

	// Register all routes
	handlers.RegisterRoutes(e, gameServer)

	// Setup shutdown handlers
	app.SetupShutdown(e, gameServer)

	// Log that initialization is complete
	log.Printf("Initialization complete, game server active")

	// Let the Echo server run (this will block)
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Printf("Echo server error: %v", err)
	}
}
