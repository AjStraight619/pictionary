package ws

import (
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// Serve web socket to client
func ServeWs(h *Hub, w http.ResponseWriter, r *http.Request, userId string) {
	roomId := chi.URLParam(r, "roomId")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade:", err)
		return
	}
	client := &Client{hub: h, conn: conn, send: make(chan []byte, 256), lastPong: time.Now(), ping: make(chan struct{}, 1), userId: userId}
	conn.EnableWriteCompression(true)
	client.hub.register <- client

	conn.SetPongHandler(func(appData string) error {
		client.lastPong = time.Now()
		log.Println("Pong received from client:", client.userId)
		return nil
	})

	log.Printf("clients: %v", h.clients)

	go client.readMessages()
	go client.writeMessages()

	log.Printf("Room %s: client connected", roomId)

}
