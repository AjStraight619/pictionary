package shared

type GameOptions struct {
	TurnTimeLimit       int `json:"turnTimeLimit"`
	WordSelectTimeLimit int `json:"wordSelectTimeLimit"`
	RoundLimit          int `json:"roundLimit"`
	MaxPlayers          int `json:"maxPlayers"`
}
