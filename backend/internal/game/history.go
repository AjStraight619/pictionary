package game

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"gorm.io/gorm"
)

// HistoryService handles recording game history and statistics
type HistoryService struct {
	db *gorm.DB
}

// NewHistoryService creates a new game history service
func NewHistoryService() *HistoryService {
	return &HistoryService{
		db: db.DB,
	}
}

// RecordGameStart records the start of a game
func (s *HistoryService) RecordGameStart(gameID string, options shared.GameOptions, players []*shared.Player) error {
	if gameID == "" {
		return errors.New("game ID is required")
	}

	// Serialize game options
	optionsJSON, err := json.Marshal(options)
	if err != nil {
		log.Printf("Error serializing game options: %v", err)
		return errors.New("error recording game")
	}

	// Create game record
	game := db.Game{
		ID:          gameID,
		StartedAt:   time.Now(),
		PlayerCount: len(players),
		Options:     string(optionsJSON),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Start transaction
	tx := s.db.Begin()

	// Create game record
	if err := tx.Create(&game).Error; err != nil {
		tx.Rollback()
		log.Printf("Error creating game record: %v", err)
		return errors.New("error recording game")
	}

	// Record player participation
	for _, player := range players {
		// Check if player exists in the database
		var user db.User
		if err := tx.Where("id = ?", player.ID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Create temporary user record for non-registered players
				user = db.User{
					ID:        player.ID,
					Username:  player.Username,
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				}
				if err := tx.Create(&user).Error; err != nil {
					tx.Rollback()
					log.Printf("Error creating temporary user: %v", err)
					return errors.New("error recording game")
				}
			} else {
				tx.Rollback()
				log.Printf("Error checking user: %v", err)
				return errors.New("error recording game")
			}
		}

		// Create participation record
		participation := db.GameParticipation{
			UserID:    player.ID,
			GameID:    gameID,
			Score:     0, // Initial score is 0
			IsHost:    player.IsHost,
			JoinedAt:  time.Now(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := tx.Create(&participation).Error; err != nil {
			tx.Rollback()
			log.Printf("Error creating participation record: %v", err)
			return errors.New("error recording game")
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		return errors.New("error recording game")
	}

	return nil
}

// RecordGameEnd records the end of a game with final scores
func (s *HistoryService) RecordGameEnd(gameID string, winnerID string, playerScores map[string]int) error {
	if gameID == "" {
		return errors.New("game ID is required")
	}

	// Start transaction
	tx := s.db.Begin()

	// Update game record
	if err := tx.Model(&db.Game{}).Where("id = ?", gameID).Updates(map[string]interface{}{
		"ended_at":   time.Now(),
		"winner_id":  winnerID,
		"updated_at": time.Now(),
	}).Error; err != nil {
		tx.Rollback()
		log.Printf("Error updating game record: %v", err)
		return errors.New("error recording game end")
	}

	// Update participation records with final scores
	for playerID, score := range playerScores {
		if err := tx.Model(&db.GameParticipation{}).
			Where("game_id = ? AND user_id = ?", gameID, playerID).
			Updates(map[string]interface{}{
				"score":      score,
				"left_at":    time.Now(),
				"updated_at": time.Now(),
			}).Error; err != nil {
			tx.Rollback()
			log.Printf("Error updating participation record: %v", err)
			return errors.New("error recording game end")
		}

		// Update user stats
		won := playerID == winnerID
		if err := tx.Exec(`
			UPDATE users
			SET 
				games_played = games_played + 1,
				games_won = CASE WHEN ? THEN games_won + 1 ELSE games_won END,
				total_score = total_score + ?,
				highest_score = CASE WHEN ? > highest_score THEN ? ELSE highest_score END,
				updated_at = ?
			WHERE id = ?
		`, won, score, score, score, time.Now(), playerID).Error; err != nil {
			tx.Rollback()
			log.Printf("Error updating user stats: %v", err)
			return errors.New("error recording game end")
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		return errors.New("error recording game end")
	}

	return nil
}

// RecordWordGuess records a word guess attempt
func (s *HistoryService) RecordWordGuess(gameID, playerID string, wordID uint, guess string, correct bool, guessTime time.Duration) error {
	wordGuess := db.WordGuess{
		GameID:    gameID,
		UserID:    playerID,
		WordID:    wordID,
		Guess:     guess,
		Correct:   correct,
		GuessTime: guessTime,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(&wordGuess).Error; err != nil {
		log.Printf("Error recording word guess: %v", err)
		return errors.New("error recording word guess")
	}

	return nil
}

// GetGameStatistics returns statistics for a specific game
func (s *HistoryService) GetGameStatistics(gameID string) (*db.Game, []db.GameParticipation, error) {
	var game db.Game
	if err := s.db.Where("id = ?", gameID).First(&game).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("game not found")
		}
		log.Printf("Error retrieving game: %v", err)
		return nil, nil, errors.New("error retrieving game statistics")
	}

	var participations []db.GameParticipation
	if err := s.db.Preload("User").Where("game_id = ?", gameID).Find(&participations).Error; err != nil {
		log.Printf("Error retrieving game participations: %v", err)
		return nil, nil, errors.New("error retrieving game statistics")
	}

	return &game, participations, nil
}

// GetUserTopGames returns a user's top scoring games
func (s *HistoryService) GetUserTopGames(userID string, limit int) ([]db.GameParticipation, error) {
	if limit <= 0 {
		limit = 5
	}

	var participations []db.GameParticipation
	if err := s.db.Preload("Game").
		Where("user_id = ?", userID).
		Order("score DESC").
		Limit(limit).
		Find(&participations).Error; err != nil {
		log.Printf("Error retrieving user top games: %v", err)
		return nil, errors.New("error retrieving user top games")
	}

	return participations, nil
}
