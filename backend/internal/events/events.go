package events

import (
	"encoding/json"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	// Add game specific types if needed for payloads, e.g. game.GameState (though usually shared types are better for DTOs)
)

// ======================================================================
// I. SHARED EVENT TYPE DEFINITIONS & CONSTANTS
//    (Used for both Client->Server and Server->Client message 'type' fields)
// ======================================================================

type PictionaryEventType string // Renamed for clarity, represents all message types

const (
	// --- Client-Initiated Actions (Client -> Server) ---
	EvtPlayerGuess       PictionaryEventType = "playerGuess"
	EvtSelectWord        PictionaryEventType = "selectWord"
	EvtPlayerReady       PictionaryEventType = "playerReady"
	EvtPlayerToggleReady PictionaryEventType = "playerToggleReady"
	EvtStartTimer        PictionaryEventType = "startTimer"   // e.g., host starts game countdown
	EvtStopTimer         PictionaryEventType = "stopTimer"    // e.g., host cancels game countdown
	EvtRemovePlayer      PictionaryEventType = "removePlayer" // Host requests to remove another player
	EvtCursorUpdate      PictionaryEventType = "cursorUpdate"
	EvtRequestGameState  PictionaryEventType = "requestGameState" // Client explicitly requests current state

	// --- Server-Initiated Notifications & State Updates (Server -> Client) ---
	EvtGameStateUpdate      PictionaryEventType = "gameState"            // Server sends the full/partial game state
	EvtPlayerJoined         PictionaryEventType = "playerJoined"         // Notifies clients a new player joined
	EvtPlayerLeft           PictionaryEventType = "playerLeft"           // Notifies clients a player left (gracefully or disconnect)
	EvtPlayerRemoved        PictionaryEventType = "playerRemoved"        // Notifies clients a player was kicked
	EvtDrawingPlayerChanged PictionaryEventType = "drawingPlayerChanged" // Notifies who the new drawer is
	EvtWordSelected         PictionaryEventType = "wordSelected"         // Confirms to drawer, or sends masked word to others
	EvtRevealedLetters      PictionaryEventType = "revealedLetters"      // Server sends updated revealed letters for the word
	EvtScoreUpdated         PictionaryEventType = "scoreUpdated"         // A player's score has changed
	EvtTurnTimerTick        PictionaryEventType = "turnTimer"            // Server sends remaining turn time
	EvtSelectWordTimerTick  PictionaryEventType = "selectWordTimer"      // Server sends remaining word selection time
	EvtGameCountdownTick    PictionaryEventType = "startGameCountdown"   // Server sends remaining pre-game countdown
	EvtOpenSelectWordModal  PictionaryEventType = "openSelectWordModal"  // Server tells drawer to select a word
	EvtGameEnded            PictionaryEventType = "gameEnded"            // Notifies game is over
	EvtErrorNotification    PictionaryEventType = "errorNotification"    // Server sends an error/info message to a client
	EvtToastNotification    PictionaryEventType = "toastNotification"    // Server sends a toast message to a client
	// Add more server-to-client message types as needed
)

// ======================================================================
// II. CLIENT-FACING PAYLOAD STRUCTURES
//     (Defines the 'payload' for specific PictionaryEventType values)
// ======================================================================

// GenericMessage is the structure for messages sent to/from clients.
// The 'Type' field uses one of the PictionaryEventType constants.
type GenericMessage struct {
	Type    PictionaryEventType `json:"type"`
	Payload json.RawMessage     `json:"payload"`
}

// --- Payloads for Client -> Server messages ---
// (These are largely what you had, just ensuring consistency)

// type StartTimerPayload struct { // For EvtStartTimer
// 	TimerType string `json:"timerType"` // e.g., "gameStartCountdown"
// 	Duration  int    `json:"duration"`  // Optional, server might have fixed durations
// }
// type StopTimerPayload struct { // For EvtStopTimer
// 	TimerType string `json:"timerType"`
// }
// type SelectWordPayload struct { // For EvtSelectWord
// 	Word shared.Word `json:"word"`
// }
// type GameStateRequestPayload struct { // For EvtRequestGameState
// 	// PlayerID string `json:"playerID"` // Often implicit
// }
// type PlayerGuessPayload struct { // For EvtPlayerGuess
// 	Guess string `json:"guess"`
// }

// // PlayerReadyPayload can be empty if PlayerID is implicit from connection
// type PlayerReadyPayload struct{} // For EvtPlayerReady

// // PlayerToggleReadyPayload can be empty
// type PlayerToggleReadyPayload struct{} // For EvtPlayerToggleReady

// type Cursor struct {
// 	X int `json:"x"`
// 	Y int `json:"y"`
// }
// type CursorUpdatePayload struct { // For EvtCursorUpdate
// 	Cursor Cursor `json:"cursor"`
// }
// type RemovePlayerPayload struct { // For EvtRemovePlayer (sent by host)
// 	PlayerID string `json:"playerID"` // ID of player to remove
// }

// --- Payloads for Server -> Client messages ---
// Some payloads might be reused (e.g., a Player struct), others are specific.

// GameStateUpdatePayload is the actual game state sent to clients.
// This should match the structure your frontend expects for the entire game view.
// It might be different from game.GameState if you transform it.
// For simplicity, let's assume it's based on shared.Player and other shared/simple types.
type GameStateUpdatePayload struct {
	ID              string             `json:"id"`
	Players         []*shared.Player   `json:"players"` // Array of current players
	PlayerOrder     []string           `json:"playerOrder"`
	CurrentDrawerID string             `json:"currentDrawerID,omitempty"`
	Options         shared.GameOptions `json:"options"`
	Status          string             `json:"status"` // e.g., "NotStarted", "InProgress", "Finished"
	RoundCount      int                `json:"roundCount"`
	// CurrentTurn specific info (e.g., word (masked for guessers), revealed letters)
	WordToGuess     string        `json:"wordToGuess,omitempty"` // Masked for guessers, full for drawer
	RevealedLetters []string      `json:"revealedLetters,omitempty"`
	IsSelectingWord bool          `json:"isSelectingWord"`           // True if current drawer is selecting
	SelectableWords []shared.Word `json:"selectableWords,omitempty"` // Only for the drawer during selection phase
}

type PlayerJoinedPayload struct { // For EvtPlayerJoined
	Player *shared.Player `json:"player"`
}
type PlayerLeftPayload struct { // For EvtPlayerLeft
	PlayerID string `json:"playerID"`
	Username string `json:"username"` // For display
}
type PlayerRemovedPayload struct { // For EvtPlayerRemoved
	PlayerID string `json:"playerID"`
	Username string `json:"username"`
	HostID   string `json:"hostID"` // Who initiated removal
}
type DrawingPlayerChangedPayload struct { // For EvtDrawingPlayerChanged
	Player *shared.Player `json:"player"` // The new drawer
}
type WordSelectedPayload struct { // For EvtWordSelected (to drawer with full word, to others with masked)
	Word            string   `json:"word"` // Full word for drawer, masked for others
	IsDrawer        bool     `json:"isDrawer"`
	RevealedLetters []string `json:"revealedLetters,omitempty"` // Initial state of revealed letters
}
type RevealedLettersPayload struct { // For EvtRevealedLetters
	Letters []string `json:"letters"`
}
type ScoreUpdatedPayload struct { // For EvtScoreUpdated
	PlayerID string `json:"playerID"`
	NewScore int    `json:"newScore"`
	// Optional: pointsChange int `json:"pointsChange,omitempty"`
}
type TimerTickPayload struct { // For EvtTurnTimerTick, EvtSelectWordTimerTick, EvtGameCountdownTick
	TimerType     string `json:"timerType"` // To distinguish on client if needed
	TimeRemaining int    `json:"timeRemaining"`
}
type OpenSelectWordModalPayload struct { // For EvtOpenSelectWordModal (sent to drawer)
	SelectableWords []shared.Word `json:"selectableWords"`
	TimeLimit       int           `json:"timeLimit"` // How long they have to pick
}
type GameEndedPayload struct { // For EvtGameEnded
	Winner *shared.Player `json:"winner,omitempty"` // Optional winner
	Scores map[string]int `json:"scores"`           // PlayerID -> Score
	// Reason   string           `json:"reason,omitempty"` // e.g., "round_limit_reached", "all_players_left"
}
type ErrorNotificationPayload struct { // For EvtErrorNotification
	Message string `json:"message"`
	Code    int    `json:"code,omitempty"` // Optional error code
}

type ToastNotificationPayload struct { // For EvtToastNotification
	Message  string `json:"message"`
	Severity string `json:"severity"`           // e.g. "info", "warning", "error", "success"
	Duration int    `json:"duration,omitempty"` // Optional duration in ms
}

// ======================================================================
// III. INTERNAL GAME QUEUE EVENT DEFINITIONS
//      (Structs for the game's own event processing queue)
// ======================================================================

// GameInputEvent represents any event the game loop will process.
type GameInputEvent interface{} // Using empty interface; Game.Run() will use a type switch.

// ClientMessageEvent wraps a message that originated from a WebSocket client.
// It carries the strictly typed PictionaryEventType and the raw Payload.
type ClientMessageEvent struct {
	PlayerID string              // ID of the player who sent the message
	Type     PictionaryEventType // The STRICTLY TYPED event type (one of the PictionaryEventType constants)
	Payload  json.RawMessage     // The raw JSON payload for the specific event type
}

// PlayerConnectionEvent signifies player connection changes.
type PlayerConnectionEvent struct {
	PlayerID string
	Type     PlayerConnectionEventType
	Client   shared.ClientInterface // Present for ReconnectAttempt, nil for Disconnect
}
type PlayerConnectionEventType string

const (
	EvPlayerDisconnected PlayerConnectionEventType = "PlayerDisconnected"
	EvPlayerReconnected  PlayerConnectionEventType = "PlayerReconnected"
)

// ServerTimerType defines recognized types for internal server timers.
type ServerTimerType string

const (
	TimerWordSelectionExpired ServerTimerType = "WORD_SELECTION_EXPIRED"
	TimerTurnEnded            ServerTimerType = "TURN_TIMER_ENDED"
	TimerPermanentRemoval     ServerTimerType = "PERMANENT_REMOVAL_TIMER_EXPIRED"
	TimerGameStartCountdown   ServerTimerType = "GAME_START_COUNTDOWN_FINISHED"
)

// InternalTimerEvent for server-side timers.
type InternalTimerEvent struct {
	GameID    string
	TimerType ServerTimerType // STRICTLY TYPED timer type
	Data      interface{}     // Optional associated data
}

// GameFlowTransitionType defines recognized types for internal game state machine transitions.
type GameFlowTransitionType string

const (
	FlowStartGameRequest   GameFlowTransitionType = "START_GAME_REQUESTED"
	FlowStartRound         GameFlowTransitionType = "START_ROUND"
	FlowStartTurn          GameFlowTransitionType = "START_TURN"
	FlowEndTurn            GameFlowTransitionType = "END_TURN"
	FlowEndRound           GameFlowTransitionType = "END_ROUND"
	FlowErrorWordSelection GameFlowTransitionType = "ERROR_WORD_SELECTION"
	FlowGameShouldEnd      GameFlowTransitionType = "GAME_SHOULD_END"
)

// InternalStateTransitionEvent for game flow steps.
type InternalStateTransitionEvent struct {
	GameID         string
	TransitionType GameFlowTransitionType // STRICTLY TYPED transition type
	Data           interface{}            // Optional associated data
}

// PlayerAddRequestEvent for HTTP handlers to request adding players.
type PlayerAddRequestEvent struct {
	Player *shared.Player // The player object to be added
}
