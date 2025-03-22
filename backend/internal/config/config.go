package config

import "os"

type Config struct {
	Port           string
	Environment    string
	AllowedOrigins []string
}

func GetConfig() *Config {
	if os.Getenv("RAILWAY_ENVIRONMENT_NAME") != "" {
		// Production settings
		return &Config{
			Port:        os.Getenv("PORT"),
			Environment: "production",
			AllowedOrigins: []string{
				"",
			},
		}
	}

	// Development settings
	return &Config{
		Port:        "8080",
		Environment: "development",
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		},
	}
}
