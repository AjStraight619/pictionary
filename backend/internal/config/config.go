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
				"",               // Add your production frontend URL here
				"exp://exp.host", // Allow connections from the Expo app in production
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
			"exp://localhost:*",        // Allow Expo on localhost (various ports)
			"exp://192.168.*.*:*",      // Allow Expo on local network IPs
			"http://localhost:19000",   // Expo dev client
			"http://localhost:19001",   // Expo dev client alternative port
			"http://localhost:19002",   // Expo dev tools
			"http://192.168.*.*:19000", // Expo on local network
			"http://192.168.*.*:19001", // Expo on local network alternative port
			"http://192.168.*.*:19002", // Expo dev tools on local network
		},
	}
}
