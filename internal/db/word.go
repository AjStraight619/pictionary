package db

import (
	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

func GetRandomWords(n int) ([]shared.Word, error) {
	var words []shared.Word
	if err := DB.Order("RANDOM()").Limit(n).Find(&words).Error; err != nil {
		return nil, err
	}
	return words, nil
}
