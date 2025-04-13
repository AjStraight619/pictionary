package app

import (
	"log"
	"os"

	"github.com/Ajstraight619/pictionary-server/internal/db"
)

// InitDB ensures the data directory exists and initializes the database connection
func InitDB() error {
	// Check for DATABASE_URL first (PostgreSQL)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		log.Printf("Using PostgreSQL database from DATABASE_URL")
		// Pass empty string to InitDB since it reads DATABASE_URL internally
		if err := db.InitDB(""); err != nil {
			log.Printf("Failed to initialize PostgreSQL: %v", err)
			return err
		}
	} else {
		// SQLite fallback (not used in production)
		log.Printf("No DATABASE_URL found, this will cause errors in production")
		return db.InitDB("")
	}

	// Migrate all models
	if err := db.MigrateAllModels(); err != nil {
		log.Printf("Failed to migrate models: %v", err)
		return err
	}

	return nil
}
