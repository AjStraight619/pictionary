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

func main() {
	err := godotenv.Load("/Users/alex/projects/webapps/pictionary-final/.env")

	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	connStr := os.Getenv("DATABASE_URL")
	database, err := db.GetDB(connStr)

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

	hubManager := ws.NewHubManager()

	r.Get("/ws/{roomId}", func(w http.ResponseWriter, r *http.Request) {
		roomId := chi.URLParam(r, "roomId")
		userId := r.URL.Query().Get("userId")
		log.Printf("WebSocket endpoint hit for roomId: %s, userId: %s", roomId, userId)
		hub := hubManager.GetHub(roomId)
		log.Println("WebSocket endpoint hit")
		ws.ServeWs(hub, w, r, userId)
		log.Printf("Room %s: client connected with userId: %s", roomId, userId)
	})

	http.ListenAndServe(":8000", r)

}
