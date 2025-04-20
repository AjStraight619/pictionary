package db

import (
	"errors"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitDB initializes the database connection and runs migrations
func InitDB() error {
	var err error

	// Check for DATABASE_URL environment variable
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Printf("No DATABASE_URL found in environment variables")
		return errors.New("DATABASE_URL environment variable not set")
	}

	// Initialize PostgreSQL connection
	log.Printf("Initializing PostgreSQL connection from DATABASE_URL")
	DB, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	if err != nil {
		log.Printf("Failed to initialize database: %v", err)
		return err
	}

	log.Println("Database connection initialized")

	// Run migrations automatically
	if err := MigrateAllModels(); err != nil {
		log.Printf("Failed to run migrations: %v", err)
		return err
	}

	log.Println("Database initialization complete")
	return nil
}

// MigrateModels runs migrations on specified models
func MigrateModels(models ...interface{}) error {
	if DB == nil {
		return errors.New("database connection not initialized")
	}

	if err := DB.AutoMigrate(models...); err != nil {
		log.Printf("Failed to run migrations: %v", err)
		return err
	}

	log.Println("Database migrations completed")
	return nil
}
