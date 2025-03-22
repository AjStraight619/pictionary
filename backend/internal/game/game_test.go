package game_test

//
// import (
// 	"net/http"
// 	"net/http/httptest"
// 	"strings"
// 	"testing"
// 	"time"
//
// 	e "github.com/Ajstraight619/pictionary-server/internal/events"
// 	g "github.com/Ajstraight619/pictionary-server/internal/game"
// 	"github.com/Ajstraight619/pictionary-server/internal/shared"
// 	"github.com/Ajstraight619/pictionary-server/internal/ws"
// 	"github.com/gorilla/websocket"
// )
//
// var hubs = ws.NewHubs()
//
// var gameOptions = shared.GameOptions{
// 	MaxPlayers:          4,
// 	TurnTimeLimit:       60,
// 	RoundLimit:          3,
// 	WordSelectTimeLimit: 30,
// }
//
// func echoHandler(w http.ResponseWriter, r *http.Request) {
// 	upgrader := websocket.Upgrader{
// 		// For testing, we allow all origins.
// 		CheckOrigin: func(r *http.Request) bool { return true },
// 	}
// 	conn, err := upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		http.Error(w, "Upgrade error", http.StatusBadRequest)
// 		return
// 	}
// 	defer conn.Close()
//
// 	// In this simple test, just keep reading messages in a loop.
// 	for {
// 		mt, msg, err := conn.ReadMessage()
// 		if err != nil {
// 			break
// 		}
// 		// Echo back the same message.
// 		if err := conn.WriteMessage(mt, msg); err != nil {
// 			break
// 		}
// 	}
// }
//
// func dialWS(wsURL string) (*websocket.Conn, error) {
// 	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
// 	return conn, err
// }
//
// func createTestHubAndClients(t *testing.T, playerIDs []string) (*ws.Hub, []*ws.Client, func()) {
// 	// Create a test HTTP server.
// 	server := httptest.NewServer(http.HandlerFunc(echoHandler))
// 	// Convert the server URL to a WebSocket URL.
// 	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
//
// 	// Create a Hub and run it.
// 	hub := ws.NewHub()
// 	go hub.Run()
//
// 	var clients []*ws.Client
// 	// For each player, dial the WebSocket and create a client.
// 	for _, pid := range playerIDs {
// 		conn, err := dialWS(wsURL)
// 		if err != nil {
// 			t.Fatalf("Dial failed for player %s: %v", pid, err)
// 		}
// 		client := ws.NewClient(hub, conn, pid)
// 		clients = append(clients, client)
// 		// Register the client.
// 		hub.Register <- client
//
// 		// Start the client's Read and Write loops.
// 		go client.Read()
// 		go client.Write()
// 	}
//
// 	// Teardown function to close all client connections and the test server.
// 	teardown := func() {
// 		for _, client := range clients {
// 			client.Conn.Close()
// 		}
// 		server.Close()
// 	}
//
// 	return hub, clients, teardown
// }
//
// func createPlayers() []*shared.Player {
// 	players := []*shared.Player{
// 		{
// 			ID:       "player1",
// 			Username: "player1",
// 			IsHost:   true,
// 		},
// 		{
// 			ID:       "player2",
// 			Username: "player2",
// 		},
// 		{
// 			ID:       "player3",
// 			Username: "player3",
// 		},
// 		{
// 			ID:       "player4",
// 			Username: "player4",
// 		},
// 	}
//
// 	return players
// }
//
// // func TestGame(t *testing.T) {
// //
// // 	hub := ws.NewHub()
// // 	hubs.AddHub("testHub", hub)
// //
// // 	go hub.Run()
// //
// // 	game := g.NewGame("testGame", gameOptions, hub)
// //
// // 	for _, player := range createPlayers() {
// // 		p := g.NewPlayer(player.ID, player.Username, player.IsHost)
// // 		game.AddPlayer(p)
// // 		fmt.Println(p)
// // 	}
// //
// // }
//
// func TestGameWithRealClients(t *testing.T) {
// 	// Define some player IDs.
// 	playerIDs := []string{"player1", "player2", "player3", "player4"}
//
// 	// Create Hub and Clients.
// 	hub, clients, teardown := createTestHubAndClients(t, playerIDs)
// 	defer teardown()
//
// 	// Create game options.
// 	gameOptions := shared.GameOptions{
// 		MaxPlayers:          4,
// 		TurnTimeLimit:       60,
// 		RoundLimit:          3,
// 		WordSelectTimeLimit: 30,
// 	}
//
// 	// Create a new Game using the Hub as the Messenger.
// 	game := g.NewGame("testGame", gameOptions, hub)
//
// 	// Add players to the game.
// 	for _, pid := range playerIDs {
// 		// Create a new player.
// 		p := g.NewPlayer(pid, pid, pid == "player1")
// 		game.AddPlayer(p)
// 		t.Logf("Added player: %s", p)
// 	}
//
// 	// Now simulate a broadcast from the Hub.
// 	testMsg := []byte(`{"type":"test","payload":"hello from hub"}`)
// 	hub.BroadcastMessage(testMsg)
//
// 	// Wait briefly to allow messages to propagate.
// 	time.Sleep(200 * time.Millisecond)
//
// 	// Check that each client received the broadcast message.
// 	for _, client := range clients {
// 		select {
// 		case msg := <-client.Send:
// 			t.Logf("Client %s received: %s", client.PlayerID, string(msg))
// 		case <-time.After(1 * time.Second):
// 			t.Errorf("Client %s did not receive any message", client.PlayerID)
// 		}
// 	}
//
// 	// Optionally, simulate sending a GameEvent.
// 	// For example, let's send a dummy GameEvent:
// 	dummyEvent := e.GameEvent{
// 		Type:    "testEvent",
// 		Payload: []byte(`{"info": "event payload"}`),
// 	}
// 	hub.GameEvents <- dummyEvent
//
// 	// Let the hub process the event.
// 	time.Sleep(100 * time.Millisecond)
// 	// (In a full integration test, you'd have additional logic in your Game
// 	// or Hub to process and broadcast responses to such events.)
// }
