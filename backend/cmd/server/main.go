package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Ajstraight619/pictionary-server/config"
	"github.com/Ajstraight619/pictionary-server/internal/app"
	"github.com/Ajstraight619/pictionary-server/internal/handlers"
	"github.com/Ajstraight619/pictionary-server/internal/server"
)

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

func main() {
	if os.Getenv("PORT") == "" {
		os.Setenv("PORT", "8080")
	}

	// Start health check server on main port
	healthPort := os.Getenv("PORT")
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthCheckHandler)

	go func() {
		server := &http.Server{
			Addr:    ":" + healthPort,
			Handler: mux,
		}

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Health check server error: %v", err)
		}
	}()

	time.Sleep(1 * time.Second)

	cfg := config.GetConfig()

	if err := app.InitDB(); err != nil {
		log.Printf("Database initialization failed: %v", err)
	}

	e := app.InitEcho(cfg)

	gameServer := server.NewGameServer()
	handlers.RegisterRoutes(e, gameServer)
	app.SetupShutdown(e, gameServer)

	if err := e.Start(":" + cfg.Port); err != nil {
		log.Printf("Server error: %v", err)
	}
}
