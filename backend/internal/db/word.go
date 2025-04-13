package db

import (
	"os"
	"strings"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

func GetRandomWords(n int) ([]shared.Word, error) {
	var words []shared.Word
	query := DB

	// Use database-specific random function based on the connection type
	if os.Getenv("DATABASE_URL") != "" && strings.Contains(os.Getenv("DATABASE_URL"), "postgres") {
		// PostgreSQL uses RANDOM()
		query = query.Order("RANDOM()")
	} else {
		// SQLite uses RANDOM() too, but we keep this separate for clarity
		query = query.Order("RANDOM()")
	}

	// Get random words limited by n
	if err := query.Limit(n).Find(&words).Error; err != nil {
		return nil, err
	}
	return words, nil
}
