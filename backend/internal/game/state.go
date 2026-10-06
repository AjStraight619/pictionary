package game

import (
	"encoding/json"
	"log"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

type Status int

const (
	NotStarted Status = iota
	InProgress
	Finished
)

type GameState struct {
	Timers          map[string]int     `json:"timers"`
	SelectableWords []shared.Word      `json:"selectableWords"`
	ID              string             `json:"id"`
	Players         []*shared.Player   `json:"players"`
	PlayerOrder     []string           `json:"playerOrder"`
	CurrentDrawerID string             `json:"currentDrawerID"`
	Options         shared.GameOptions `json:"options"`
	Status          Status             `json:"status"`
	Round           *Round             `json:"round"`
	Turn            *Turn              `json:"turn"`
	WordToGuess     *shared.Word       `json:"wordToGuess,omitempty"`
	IsSelectingWord bool               `json:"isSelectingWord"`
}

func (g *Game) GetGameState() GameState {
	g.Mu.RLock()
	defer g.Mu.RUnlock()
	orderedPlayers := make([]*shared.Player, 0, len(g.PlayerOrder))
	for _, id := range g.PlayerOrder {
		if player, exists := g.Players[id]; exists {
			copy := *player
			orderedPlayers = append(orderedPlayers, &copy)
		}
	}
	timers := make(map[string]int)
	for name, timer := range g.timers {
		timers[name] = timer.Remaining()
	}
	turn := *g.CurrentTurn
	turn.RevealedLetters = append([]rune(nil), turn.RevealedLetters...)
	turn.SelectableWords = append([]shared.Word(nil), turn.SelectableWords...)
	turn.PlayersGuessedCorrectly = make(map[string]bool)
	for id, value := range g.CurrentTurn.PlayersGuessedCorrectly {
		turn.PlayersGuessedCorrectly[id] = value
	}
	round := *g.Round
	round.PlayersDrawn = append([]string(nil), round.PlayersDrawn...)
	return GameState{
		Timers:          timers,
		SelectableWords: turn.SelectableWords,
		ID:              g.ID,
		Players:         orderedPlayers,
		PlayerOrder:     append([]string(nil), g.PlayerOrder...),
		CurrentDrawerID: g.Round.CurrentDrawerID,
		Options:         g.Options,
		Status:          g.Status,
		Round:           &round,
		Turn:            &turn,
		IsSelectingWord: g.CurrentTurn.IsSelectingWord,
	}
}

func (g *Game) BroadcastGameState() {
	state := g.GetGameState()
	b, err := json.Marshal(map[string]any{
		"type":    "gameState",
		"payload": state,
	})
	if err != nil {
		log.Println("error marshalling game state:", err)

	}
	g.Messenger.BroadcastMessage(b)
}

func (g *Game) String() string {
	state := g.GetGameState()
	b, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return "Error marshalling game state: " + err.Error()
	}
	return string(b)
}
