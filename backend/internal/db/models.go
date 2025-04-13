package db

import (
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a registered user in the system
type User struct {
	ID             string         `gorm:"primaryKey;type:uuid"`
	Username       string         `gorm:"uniqueIndex;not null"`
	Email          string         `gorm:"uniqueIndex;not null"`
	PasswordHash   string         `gorm:"not null"`
	ProfilePicture string         `gorm:"default:''"`
	GamesPlayed    int            `gorm:"default:0"`
	GamesWon       int            `gorm:"default:0"`
	TotalScore     int            `gorm:"default:0"`
	HighestScore   int            `gorm:"default:0"`
	CreatedAt      time.Time      `gorm:"not null"`
	UpdatedAt      time.Time      `gorm:"not null"`
	DeletedAt      gorm.DeletedAt `gorm:"index"`
	Games          []GameParticipation
}

// BeforeCreate generates a new UUID before creating a user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// Game represents a completed game session
type Game struct {
	ID          string         `gorm:"primaryKey;type:uuid"`
	StartedAt   time.Time      `gorm:"not null"`
	EndedAt     time.Time      `gorm:"index"`
	PlayerCount int            `gorm:"not null"`
	WinnerID    string         `gorm:"index;type:uuid"`
	Options     string         `gorm:"type:jsonb"` // Store game options as JSON
	CreatedAt   time.Time      `gorm:"not null"`
	UpdatedAt   time.Time      `gorm:"not null"`
	DeletedAt   gorm.DeletedAt `gorm:"index"`
	Winner      *User          `gorm:"foreignKey:WinnerID"`
	Players     []GameParticipation
}

// BeforeCreate generates a new UUID before creating a game
func (g *Game) BeforeCreate(tx *gorm.DB) error {
	if g.ID == "" {
		g.ID = uuid.New().String()
	}
	return nil
}

// GameParticipation tracks a user's participation in a game
type GameParticipation struct {
	UserID    string    `gorm:"primaryKey;type:uuid"`
	GameID    string    `gorm:"primaryKey;type:uuid"`
	Score     int       `gorm:"not null;default:0"`
	IsHost    bool      `gorm:"not null;default:false"`
	JoinedAt  time.Time `gorm:"not null"`
	LeftAt    time.Time
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
	User      User      `gorm:"foreignKey:UserID"`
	Game      Game      `gorm:"foreignKey:GameID"`
}

// LeaderboardEntry represents a cached leaderboard position
type LeaderboardEntry struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"`
	UserID    string         `gorm:"uniqueIndex;type:uuid"`
	Rank      int            `gorm:"not null"`
	Score     int            `gorm:"not null"`
	Games     int            `gorm:"not null"`
	Wins      int            `gorm:"not null"`
	CreatedAt time.Time      `gorm:"not null"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
	User      User           `gorm:"foreignKey:UserID"`
}

// WordGuess tracks individual word guesses in games
type WordGuess struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"`
	GameID    string         `gorm:"index;type:uuid"`
	UserID    string         `gorm:"index;type:uuid"`
	WordID    uint           `gorm:"index"`
	Guess     string         `gorm:"not null"`
	Correct   bool           `gorm:"not null"`
	GuessTime time.Duration  `gorm:"not null"` // Time taken to guess
	CreatedAt time.Time      `gorm:"not null"`
	UpdatedAt time.Time      `gorm:"not null"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
	User      User           `gorm:"foreignKey:UserID"`
	Game      Game           `gorm:"foreignKey:GameID"`
}

// MigrateAllModels runs migrations for all models in the system
func MigrateAllModels() error {
	return DB.AutoMigrate(
		&User{},
		&Game{},
		&GameParticipation{},
		&LeaderboardEntry{},
		&WordGuess{},
		&shared.Word{},
	)
}
