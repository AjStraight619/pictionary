package leaderboard

import (
	"errors"
	"log"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"gorm.io/gorm"
)

// Service handles leaderboard-related operations
type Service struct {
	db *gorm.DB
}

// NewService creates a new leaderboard service
func NewService() *Service {
	return &Service{
		db: db.DB,
	}
}

// GetTopUsers returns the top n users by score
func (s *Service) GetTopUsers(limit int) ([]db.LeaderboardEntry, error) {
	if limit <= 0 {
		limit = 10 // Default to top 10
	}

	var entries []db.LeaderboardEntry
	err := s.db.Preload("User").Order("score DESC").Limit(limit).Find(&entries).Error
	if err != nil {
		log.Printf("Error getting top users: %v", err)
		return nil, err
	}

	return entries, nil
}

// GetUserRank returns a specific user's rank
func (s *Service) GetUserRank(userID string) (*db.LeaderboardEntry, error) {
	if userID == "" {
		return nil, errors.New("user ID is required")
	}

	var entry db.LeaderboardEntry
	err := s.db.Preload("User").Where("user_id = ?", userID).First(&entry).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found in leaderboard")
		}
		log.Printf("Error getting user rank: %v", err)
		return nil, err
	}

	return &entry, nil
}

// UpdateLeaderboard recalculates the entire leaderboard
// This is an expensive operation, should be run periodically
func (s *Service) UpdateLeaderboard() error {
	log.Println("Starting leaderboard update")
	start := time.Now()

	// Using raw SQL for better performance
	err := s.db.Exec(`
		-- Truncate existing entries
		TRUNCATE TABLE leaderboard_entries;
		
		-- Insert fresh entries
		INSERT INTO leaderboard_entries (user_id, rank, score, games, wins, created_at, updated_at)
		WITH ranked_users AS (
			SELECT 
				u.id as user_id,
				u.total_score as score,
				u.games_played as games,
				u.games_won as wins,
				ROW_NUMBER() OVER (ORDER BY u.total_score DESC) as rank,
				NOW() as created_at,
				NOW() as updated_at
			FROM users u
			WHERE u.games_played > 0
		)
		SELECT user_id, rank, score, games, wins, created_at, updated_at
		FROM ranked_users
		ORDER BY rank;
	`).Error

	if err != nil {
		log.Printf("Error updating leaderboard: %v", err)
		return err
	}

	log.Printf("Leaderboard updated successfully in %v", time.Since(start))
	return nil
}

// UpdateUserStats updates a single user's stats and their leaderboard entry
func (s *Service) UpdateUserStats(userID string, score int, won bool) error {
	if userID == "" {
		return errors.New("user ID is required")
	}

	// Update user stats in a transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update user stats
	err := tx.Model(&db.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"games_played": gorm.Expr("games_played + 1"),
		"total_score":  gorm.Expr("total_score + ?", score),
		"games_won":    gorm.Expr("CASE WHEN ? THEN games_won + 1 ELSE games_won END", won),
		"highest_score": gorm.Expr("CASE WHEN ? > highest_score THEN ? ELSE highest_score END",
			score, score),
	}).Error

	if err != nil {
		tx.Rollback()
		log.Printf("Error updating user stats: %v", err)
		return err
	}

	// Get updated user data
	var user db.User
	if err := tx.Where("id = ?", userID).First(&user).Error; err != nil {
		tx.Rollback()
		log.Printf("Error getting updated user: %v", err)
		return err
	}

	// Update or create leaderboard entry
	var entry db.LeaderboardEntry
	if err := tx.Where("user_id = ?", userID).First(&entry).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new entry
			entry = db.LeaderboardEntry{
				UserID: userID,
				Score:  user.TotalScore,
				Games:  user.GamesPlayed,
				Wins:   user.GamesWon,
				Rank:   0, // Will be calculated later
			}
			if err := tx.Create(&entry).Error; err != nil {
				tx.Rollback()
				log.Printf("Error creating leaderboard entry: %v", err)
				return err
			}
		} else {
			tx.Rollback()
			log.Printf("Error finding leaderboard entry: %v", err)
			return err
		}
	} else {
		// Update existing entry
		if err := tx.Model(&entry).Updates(map[string]interface{}{
			"score": user.TotalScore,
			"games": user.GamesPlayed,
			"wins":  user.GamesWon,
		}).Error; err != nil {
			tx.Rollback()
			log.Printf("Error updating leaderboard entry: %v", err)
			return err
		}
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		return err
	}

	return nil
}
