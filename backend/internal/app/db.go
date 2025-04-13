package app

import (
	"log"
	"os"
	"path/filepath"

	"github.com/Ajstraight619/pictionary-server/internal/db"
)

// InitDB ensures the data directory exists and initializes the database connection
func InitDB() error {
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
	return db.InitDB(dbPath)
}
