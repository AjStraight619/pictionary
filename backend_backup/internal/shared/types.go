package shared

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
