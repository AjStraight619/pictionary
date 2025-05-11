package config

import (
	"fmt"
	"os"

	"go.uber.org/zap"
)

var logger *zap.Logger

func init() {
	// Base zap config
	cfg := zap.NewProductionConfig()
	// Override level if LOG_LEVEL is set
	if lvl := os.Getenv("LOG_LEVEL"); lvl != "" {
		if err := cfg.Level.UnmarshalText([]byte(lvl)); err != nil {
			fmt.Fprintf(os.Stderr, "Invalid LOG_LEVEL %q: %v\n", lvl, err)
		}
	}

	var err error
	logger, err = cfg.Build()
	if err != nil {
		panic(fmt.Sprintf("cannot initialize logger: %v", err))
	}
	// Optional: make it global too
	zap.ReplaceGlobals(logger)
}

// GetLogger returns the initialized *zap.Logger
func GetLogger() *zap.Logger {
	return logger
}
