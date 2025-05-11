package events // Or a more specific name like `gameinputevents`

import (
	"encoding/json"

	"github.com/Ajstraight619/pictionary-server/internal/shared" // For ClientInterface
)

// GameInputEvent is processed by a game's central event queue.
type GameInputEvent interface {
	isGameInputEvent() // Marker method
}

// ClientMessageEvent wraps a message from a WebSocket client.
type ClientMessageEvent struct {
	PlayerID string
	Type     string          // Original event type (e.g., from e.GameEvent.Type)
	Payload  json.RawMessage // Original payload (from e.GameEvent.Payload)
}

func (e ClientMessageEvent) isGameInputEvent() {}

// PlayerDisconnectedEvent signals a player's WebSocket connection dropped.
type PlayerDisconnectedEvent struct {
	PlayerID string
}

func (e PlayerDisconnectedEvent) isGameInputEvent() {}

// PlayerReconnectedEvent signals a player has re-established a connection.
type PlayerReconnectedEvent struct {
	PlayerID string
	Client   shared.ClientInterface // The new client interface for the reconnected player
}

func (e PlayerReconnectedEvent) isGameInputEvent() {}

// InternalTimerEvent signals a game timer has expired.
type InternalTimerEvent struct {
	GameID    string      // Context: Game ID
	TimerType string      // e.g., "TURN_TIMER", "WORD_SELECTION_TIMER"
	Data      interface{} // Optional specific data for this timer event
}

func (e InternalTimerEvent) isGameInputEvent() {}

// InternalStateTransitionEvent can be used for game flow steps.
type InternalStateTransitionEvent struct {
	GameID         string
	TransitionType string // e.g., "START_NEXT_TURN", "END_ROUND"
	Data           interface{}
}

func (e InternalStateTransitionEvent) isGameInputEvent() {}

// PlayerAddEvent signals a request to add a player to the game.
// This event is created by external callers (e.g. HTTP handlers) and processed by Game.Run().
type PlayerAddEvent struct {
	Player *shared.Player
}

func (e PlayerAddEvent) isGameInputEvent() {}

// Add more event types as you identify them (e.g., for internal flow)
// type StartNextTurnGameEvent struct{}
// func (e StartNextTurnGameEvent) isGameInputEvent() {}
