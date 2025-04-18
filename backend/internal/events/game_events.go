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

type GameStatePayload struct {
	PlayerID string `json:"playerID"`
}

type PlayerGuessPayload struct {
	PlayerID string `json:"playerID"`
	Guess    string `json:"guess"`
}

type PlayerReadyPayload struct {
	PlayerID string `json:"playerID"`
}

type PlayerToggleReadyPayload struct {
	PlayerID string `json:"playerID"`
}

type CursorUpdatePayload struct {
	PlayerID string `json:"playerID"`
	Cursor   Cursor `json:"cursor"`
}

type RemovePlayerPayload struct {
	PlayerID string `json:"playerID"`
	HostID   string `json:"hostID"`
}

type Cursor struct {
	X int `json:"x"`
	Y int `json:"y"`
}

const (
	GameState         = "gameState"
	PlayerGuess       = "playerGuess"
	StartTimer        = "startTimer"
	StopTimer         = "stopTimer"
	SelectWord        = "selectWord"
	PlayerReady       = "playerReady"
	PlayerToggleReady = "playerToggleReady"
	CursorUpdate      = "cursorUpdate"
	RemovePlayer      = "removePlayer"
)
