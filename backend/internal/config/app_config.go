package config

import "os"

type AppConfig struct {
	Port           string
	Environment    string
	AllowedOrigins []string
}

func GetAppConfig() *AppConfig {
	if os.Getenv("RAILWAY_ENVIRONMENT_NAME") != "" {
		// Production settings
		return &AppConfig{
			Port:        os.Getenv("PORT"),
			Environment: "production",
			AllowedOrigins: []string{
				"",
			},
		}
	}

	// Development settings
	return &AppConfig{
		Port:        "8080",
		Environment: "development",
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		},
	}
}
