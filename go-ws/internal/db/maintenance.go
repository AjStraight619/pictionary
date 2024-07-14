package db

import (
	"log"
	"time"

	"gorm.io/gorm"
)

func CheckAndDeleteStaleGames(database *gorm.DB) {
	games, err := GetGames(database)
	if err != nil {
		log.Printf("Error getting games: %v", err)
		return
	}

	threshold := time.Now().Add(-8 * time.Hour)
	for _, game := range games {
		if game.UpdatedAt.Before(threshold) {
			err := DeleteGame(database, game.ID)
			if err != nil {
				log.Printf("Error deleting game ID %s: %v", game.ID, err)
			} else {
				log.Printf("Deleted stale game ID %s", game.ID)
			}
		}
	}
}


// TODO: Need roomId here when a user's ping > 30 seconds we hit Next.js API endpoint to remove them from the room


// func RemoveUser(database *gorm.DB) {

// 	players, err := GetPlayers(database)
// 	if err != nil {
// 		log.Printf("Error getting players: %v", err)
// 		return
// 	}

// }
