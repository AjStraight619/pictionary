package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/AjStraight619/pictionary-final/go-ws/internal/db"
	"github.com/AjStraight619/pictionary-final/go-ws/internal/ws"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

// /Users/alex/projects/webapps/pictionary-final/
func main() {
	env := os.Getenv("ENV")
	if env == "" {
		env = "development"
	}

	if env == "development" {
		err := godotenv.Load("/Users/alex/projects/webapps/pictionary-final/")
		if err != nil {
			log.Printf("No .env file found: %v", err)
		}
	}

	

	log.Printf("Running in %s mode", env)

	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatalf("DATABASE_URL environment variable is not set")
	}
	database, err := db.GetDB("postgresql://neondb_owner:h1SjWtbuZ3Yw@ep-odd-lab-a5dvqd7l-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	games, err := db.GetGames(database)
	if err != nil {
		log.Fatalf("Error getting games: %v", err)
	}

	for _, game := range games {
		log.Printf("ID: %s, Name: %s, Status: %s, UpdatedAt: %s\n", game.ID, game.Name, game.Status, game.UpdatedAt)
	}

	go func() {
		for {
			db.CheckAndDeleteStaleGames(database)
			time.Sleep(5 * time.Minute)
		}
	}()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("welcome"))
	})

	hubManager := ws.NewHubManager(database)

	r.Get("/ws/{roomId}", func(w http.ResponseWriter, r *http.Request) {
		roomId := chi.URLParam(r, "roomId")
		userId := r.URL.Query().Get("userId")
		log.Printf("WebSocket endpoint hit for roomId: %s, userId: %s", roomId, userId)
		hub := hubManager.GetHub(roomId)
		log.Println("WebSocket endpoint hit")
		ws.ServeWs(hub, w, r, userId)
		log.Printf("Room %s: client connected with userId: %s", roomId, userId)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	http.ListenAndServe("0.0.0.0:"+port, r)
}
