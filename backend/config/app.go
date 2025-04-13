package config

import "os"

type Config struct {
	Port           string
	Environment    string
	AllowedOrigins []string
	Redis          RedisConfig
}

type RedisConfig struct {
	URL      string // Full Redis URL
	Password string
	DB       int
}

func GetConfig() *Config {
	if os.Getenv("RAILWAY_ENVIRONMENT_NAME") != "" {
		// Production settings
		// Use Railway Redis service if provided
		redisURL := os.Getenv("REDIS_URL")
		if redisURL == "" {
			redisURL = "redis://localhost:6379" // Fallback
		}

		return &Config{
			Port:        os.Getenv("PORT"),
			Environment: "production",
			AllowedOrigins: []string{
				"https://pictionary-tan.vercel.app",
				"exp://exp.host", // Allow connections from the Expo app in production
			},
			Redis: RedisConfig{
				URL:      redisURL,
				Password: os.Getenv("REDIS_PASSWORD"),
				DB:       0,
			},
		}
	}

	// Development settings
	return &Config{
		Port:        "8080",
		Environment: "development",
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://localhost:5174",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:5174",
			"exp://localhost:*",
			"exp://192.168.*.*:*",
			"http://localhost:19000",
			"http://localhost:19001",
			"http://localhost:19002",
			"http://192.168.*.*:19000",
			"http://192.168.*.*:19001",
			"http://192.168.*.*:19002",
		},
		Redis: RedisConfig{
			URL:      "redis://localhost:6379",
			Password: "",
			DB:       0,
		},
	}
}
