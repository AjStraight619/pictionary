package events

import (
	"encoding/json"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

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

const (
	PlayerGuess = "playerGuess"
	StartTimer  = "startTimer"
	StopTimer   = "stopTimer"
	SelectWord  = "selectWord"
)
