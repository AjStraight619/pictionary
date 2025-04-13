package db

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB(dsn string) error {
	var err error

	DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Printf("failed to initialize database, got error %v", err)
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
