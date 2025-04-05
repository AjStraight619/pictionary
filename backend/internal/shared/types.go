package shared

import (
	"encoding/json"
	"time"
)

type GameOptions struct {
	TurnTimeLimit       int `json:"turnTimeLimit"`
	WordSelectTimeLimit int `json:"wordSelectTimeLimit"`
	RoundLimit          int `json:"roundLimit"`
	MaxPlayers          int `json:"maxPlayers"`
}

type Word struct {
	Id       uint   `gorm:"primaryKey" json:"id"`
	Word     string `gorm:"not null" json:"word"`
	Category string `gorm:"not null" json:"category"`
}

type ClientInterface interface {
	SendMessage([]byte) error
	Close() error
	Write()
	Read()
}

type Player struct {
	ID             string          `json:"ID"`
	JoinedAt       time.Time       `json:"joinedAt"`
	LeftAt         time.Time       `json:"leftAt"`
	IsHost         bool            `json:"isHost"`
	Username       string          `json:"username"`
	Score          int             `json:"score"`
	Ready          bool            `json:"ready"`
	Color          string          `json:"color"`
	IsDrawing      bool            `json:"isDrawing"`
	IsGuessCorrect bool            `json:"isGuessCorrect"`
	Pending        bool            `json:"pending"`
	Connected      bool            `json:"connected"`
	Avatar         string          `json:"avatar"`
	Client         ClientInterface `json:"-"`
	Removed        bool            `json:"removed"`
}

func (p *Player) String() string {
	b, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		return "error marshalling player"
	}
	return string(b)
}
