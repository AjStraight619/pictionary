package db

import (
	"errors"
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
		log.Printf("No DATABASE_URL found in environment variables")
		return errors.New("DATABASE_URL environment variable not set")
	}

	if err != nil {
		log.Printf("Failed to initialize database, got error %v", err)
		return err
	}

	log.Println("Database connection initialized")
	return nil
}

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
