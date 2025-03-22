package config

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type LogConfig struct {
	Level      string
	OutputPath string
}

func NewLogConfig() *LogConfig {
	return &LogConfig{
		Level:      getLogLevel(),
		OutputPath: getLogOutput(),
	}
}

func getLogLevel() string {
	if os.Getenv("ENVIRONMENT") == "production" {
		return "info"
	}
	return "debug"
}

func getLogOutput() string {
	if output := os.Getenv("LOG_OUTPUT"); output != "" {
		return output
	}
	return "stdout"
}

func (c *LogConfig) BuildLogger() (*zap.Logger, error) {
	config := zap.NewProductionConfig()
	config.OutputPaths = []string{c.OutputPath}
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

	level := zap.InfoLevel
	if c.Level == "debug" {
		level = zap.DebugLevel
		config.Development = true
	}
	config.Level = zap.NewAtomicLevelAt(level)

	return config.Build()
}
