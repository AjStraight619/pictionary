package main

import (
	"encoding/json"
	"log"
	"os"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

func main() {
	// Check for DATABASE_URL environment variable
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Fallback to SQLite for local development if no URL provided
		dbPath := "data/game.db"
		os.MkdirAll("data", os.ModePerm)
		log.Println("Using local SQLite database:", dbPath)
		db.InitDB(dbPath)
	} else {
		// Use PostgreSQL with the provided URL
		log.Println("Using PostgreSQL database")
		db.InitDB("")
	}

	// Migrate the Word model
	db.MigrateModels(&shared.Word{})

	// Read the words from JSON file
	data, err := os.ReadFile("internal/db/words.json")
	if err != nil {
		log.Fatalf("Error reading data from JSON file: %v", err)
	}

	var wordsMap map[string][]string
	if err := json.Unmarshal(data, &wordsMap); err != nil {
		log.Fatalf("Failed to parse JSON file: %v", err)
	}

	// Prepare the words to insert
	var words []shared.Word
	for category, wordsList := range wordsMap {
		for _, word := range wordsList {
			words = append(words, shared.Word{
				Word:     word,
				Category: category,
			})
		}
	}

	// Insert the words
	if err := db.DB.CreateInBatches(words, 100).Error; err != nil {
		log.Fatalf("Failed to insert words into database: %v", err)
	}

	log.Println("Successfully seeded", len(words), "words into the database")
}
