package shared

import "encoding/json"

type ClientInterface interface {
	SendMessage([]byte) error
	Close() error
	Write()
	Read()
}

type Player struct {
	ID        string          `json:"id"`
	IsHost    bool            `json:"isHost"`
	Username  string          `json:"username"`
	Score     int             `json:"score"`
	Ready     bool            `json:"ready"`
	IsDrawing bool            `json:"isDrawing"`
	Pending   bool            `json:"pending"`
	Connected bool            `json:"connected"`
	Avatar    string          `json:"avatar"`
	Client    ClientInterface `json:"-"`
}

func (p *Player) String() string {
	b, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		return "error marshalling player"
	}
	return string(b)
}
