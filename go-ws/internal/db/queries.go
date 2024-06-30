package db

import "gorm.io/gorm"

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
