package logger

import (
	"github.com/Ajstraight619/pictionary-server/internal/errors"
	"go.uber.org/zap"
)

var Log *zap.SugaredLogger

// InitLogger initializes the global logger instance
func InitLogger(logger *zap.SugaredLogger) {
	Log = logger
}

// Info logs an info level message
func Info(msg string, keysAndValues ...interface{}) {
	Log.Infow(msg, keysAndValues...)
}

// Error logs an error level message
func Error(msg string, keysAndValues ...interface{}) {
	Log.Errorw(msg, keysAndValues...)
}

// Debug logs a debug level message
func Debug(msg string, keysAndValues ...interface{}) {
	Log.Debugw(msg, keysAndValues...)
}

// GameEvent logs game-related events
func GameEvent(gameID string, event string, fields ...interface{}) {
	Log.With(
		"gameID", gameID,
		"event", event,
	).Infow("Game event", fields...)
}

// GameError logs game-related errors
func GameError(err *errors.GameError, fields ...interface{}) {
	Log.With(
		"gameID", err.GameID,
		"playerID", err.PlayerID,
		"code", err.Code,
		"error", err.Error(),
	).Errorw("Game error", fields...)
}
