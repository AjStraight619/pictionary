package db

import (
	"bytes"
	"encoding/json"
	"net/http"

	"gorm.io/gorm"
)

func GetGames(db *gorm.DB) ([]SimpleGame, error) {
	var games []SimpleGame
	if err := db.Table("Game").Find(&games).Error; err != nil {
		return nil, err
	}
	return games, nil
}

func GetPlayers(db *gorm.DB) ([]SimplePlayer, error) {
	var players []SimplePlayer
	if err := db.Table("players").Find(&players).Error; err != nil {
		return nil, err
	}
	return players, nil
}

func DeleteGame(db *gorm.DB, gameID string) error {
	result := db.Table("Game").Where("id = ?", gameID).Delete(&SimpleGame{})
	return result.Error
}

func RemoveUserFromRoom(database *gorm.DB, roomId, userId string) error {
	err := database.Transaction(func(tx *gorm.DB) error {

		if err := tx.Where("game_id = ? AND player_id = ?", roomId, userId).Delete(&GamePlayer{}).Error; err != nil {
			return err
		}

		notifyNextJs(roomId, userId)
		
		return nil
	})
	return err
}


func notifyNextJs(gameId, userId string) {
	apiUrl := "https://your-nextjs-app.com/api/redirect" 

	payload := map[string]string{"gameId": gameId, "userId": userId}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return
	}

	req, err := http.NewRequest("DELETE", apiUrl, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Handle the error if needed
	}
}


