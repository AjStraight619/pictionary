package errors

import "fmt"

type ErrorCode string

const (
	// Game errors
	ErrGameFull       ErrorCode = "GAME_FULL"
	ErrGameNotFound   ErrorCode = "GAME_NOT_FOUND"
	ErrGameNotStarted ErrorCode = "GAME_NOT_STARTED"
	ErrGameFinished   ErrorCode = "GAME_FINISHED"

	// Player errors
	ErrPlayerNotFound ErrorCode = "PLAYER_NOT_FOUND"
	ErrPlayerExists   ErrorCode = "PLAYER_EXISTS"
	ErrNotPlayerTurn  ErrorCode = "NOT_PLAYER_TURN"
	ErrPlayerIsDrawer ErrorCode = "PLAYER_IS_DRAWER"

	// WebSocket errors
	ErrConnectionFailed ErrorCode = "CONNECTION_FAILED"
	ErrInvalidMessage   ErrorCode = "INVALID_MESSAGE"
)

type GameError struct {
	Code     ErrorCode
	Message  string
	GameID   string
	PlayerID string
}

func (e *GameError) Error() string {
	return fmt.Sprintf("[%s] %s (Game: %s, Player: %s)", e.Code, e.Message, e.GameID, e.PlayerID)
}

// Helper functions to create errors
func NewGameError(code ErrorCode, message, gameID string) *GameError {
	return &GameError{
		Code:    code,
		Message: message,
		GameID:  gameID,
	}
}

func NewPlayerError(code ErrorCode, message, gameID, playerID string) *GameError {
	return &GameError{
		Code:     code,
		Message:  message,
		GameID:   gameID,
		PlayerID: playerID,
	}
}
