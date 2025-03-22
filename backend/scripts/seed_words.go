package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

func main() {
	databasePath := "data/game.db"

	os.MkdirAll("data", os.ModePerm)
	db.InitDB(databasePath)

	db.MigrateModels(&shared.Word{})

	data, err := os.ReadFile("internal/db/words.json")

	if err != nil {
		fmt.Printf("Error reading data from json file: %v", err)
		return
	}

	var wordsMap map[string][]string

	if err := json.Unmarshal(data, &wordsMap); err != nil {
		log.Fatalf("Failed to parse JSON file: %v", err)
	}

	var words []shared.Word

	for category, wordslist := range wordsMap {
		for _, word := range wordslist {
			words = append(words, shared.Word{
				Word:     word,
				Category: category,
			})
		}

	}

	if err := db.DB.CreateInBatches(words, 100).Error; err != nil {
		log.Fatalf("Failed to insert words into database: %v", err)
	}
}
