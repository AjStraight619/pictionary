package events

import (
	"encoding/json"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

// External incoming events coming from the client.

type GameEvent struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type StartTimerPayload struct {
	TimerType string `json:"timerType"`
	Duration  int    `json:"duration"`
}

type StopTimerPayload struct {
	TimerType string `json:"timerType"`
}

type SelectWordPayload struct {
	Word shared.Word `json:"word"`
}

type GameStatePayload struct {
	PlayerID string `json:"playerID"`
}

type PlayerGuessPayload struct {
	PlayerID string `json:"playerID"`
	Guess    string `json:"guess"`
}

const (
	GameState   = "gameState"
	PlayerGuess = "playerGuess"
	StartTimer  = "startTimer"
	StopTimer   = "stopTimer"
	SelectWord  = "selectWord"
)
