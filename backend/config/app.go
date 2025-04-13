package config

import (
	"log"
	"os"
	"path/filepath"
	"strings"
)

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

// LoadEnvFile attempts to load environment variables from a .env file
func LoadEnvFile() {
	// Check for .env file in current directory and parent directories
	paths := []string{".env", "../.env", "../../.env"}

	for _, path := range paths {
		absPath, _ := filepath.Abs(path)
		if _, err := os.Stat(path); err == nil {
			log.Printf("Found .env file at %s", absPath)
			content, err := os.ReadFile(path)
			if err != nil {
				log.Printf("Error reading .env file: %v", err)
				continue
			}

			// Parse each line
			lines := strings.Split(string(content), "\n")
			for _, line := range lines {
				line = strings.TrimSpace(line)
				if line == "" || strings.HasPrefix(line, "#") {
					continue // Skip empty lines and comments
				}

				// Split by first equals sign
				parts := strings.SplitN(line, "=", 2)
				if len(parts) == 2 {
					key := strings.TrimSpace(parts[0])
					value := strings.TrimSpace(parts[1])
					os.Setenv(key, value)
					log.Printf("Loaded env var: %s", key)
				}
			}
			return // Stop after finding and loading the first .env file
		}
	}

	log.Printf("No .env file found in searched paths")
}

func GetConfig() *Config {
	// Load environment variables from .env file
	LoadEnvFile()

	// Check DATABASE_URL and print it
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL != "" {
		log.Printf("DATABASE_URL is set: %s (length: %d)", dbURL[:10]+"...", len(dbURL))
	} else {
		log.Printf("WARNING: DATABASE_URL is not set")
	}

	if os.Getenv("RAILWAY_ENVIRONMENT_NAME") != "" {

		redisURL := os.Getenv("REDIS_URL")
		if redisURL == "" {
			redisURL = "redis://localhost:6379"
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
