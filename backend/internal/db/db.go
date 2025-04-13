package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(dsn string) error {
	var err error

	// Check for DATABASE_URL environment variable (PostgreSQL)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		log.Printf("Using PostgreSQL database URL from environment")
		DB, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	} else {
		log.Printf("No DATABASE_URL found, trying to use SQLite (not recommended)")
		return nil // Skip SQLite initialization
	}

	if err != nil {
		log.Printf("Failed to initialize database, got error %v", err)
		return err
	}

	log.Println("Database connection initialized")
	return nil
}

func MigrateModels(models ...interface{}) {
	if err := DB.AutoMigrate(models...); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	log.Println("Database migrations completed")
}
