package game_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	events "github.com/Ajstraight619/pictionary-server/internal/events"
	game "github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

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

// Timer and reveal regressions exercise production code, not a copy of its logic.

func TestTimerImmediateTickAndExactExpiry(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	finished := make(chan struct{})
	start := time.Now()
	ticks := game.NewTimer(ctx, "test", 1).StartCountdown(func() { close(finished) }, nil)
	select {
	case value := <-ticks:
		if value != 1 {
			t.Fatalf("initial tick=%d", value)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("no immediate tick")
	}
	select {
	case value := <-ticks:
		if value != 0 {
			t.Fatalf("final tick=%d", value)
		}
	case <-time.After(1500 * time.Millisecond):
		t.Fatal("timer waited an extra tick")
	}
	select {
	case <-finished:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("completion lagged behind zero")
	}
	if time.Since(start) < 900*time.Millisecond {
		t.Fatal("timer ended early")
	}
}

func TestTimerCancelledBeforeStart(t *testing.T) {
	timer := game.NewTimer(context.Background(), "test", 5)
	timer.Cancel()
	cancelled := make(chan struct{})
	ticks := timer.StartCountdown(func() { t.Error("cancelled timer completed") }, func() { close(cancelled) })
	select {
	case _, ok := <-ticks:
		if ok {
			t.Fatal("cancelled timer emitted a tick")
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("cancel did not close timer")
	}
	<-cancelled
}

type revealMessenger struct{ messages chan []byte }

func (m *revealMessenger) BroadcastMessage(b []byte)                 { m.messages <- b }
func (m *revealMessenger) SendToPlayer(_ string, b []byte)           { m.messages <- b }
func (m *revealMessenger) SendToOthers(_ string, b []byte)           { m.messages <- b }
func (m *revealMessenger) GameEventChannel() <-chan events.GameEvent { return nil }

func TestLetterRevealUsesWordLengthAndElapsedTime(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	m := &revealMessenger{messages: make(chan []byte, 32)}
	g := game.NewGame(ctx, "test", shared.GameOptions{TurnTimeLimit: 40}, m, nil)
	g.CurrentTurn = game.NewTurn("drawer")
	g.CurrentTurn.WordToGuess = &shared.Word{Word: "abcdefghij"}
	g.CurrentTurn.Start(g, "drawer")
	// 10 letters -> at most 7 revealed, evenly spread over 40 seconds.
	for _, step := range []struct{ remaining, want int }{{35, 0}, {34, 1}, {20, 3}, {1, 6}, {0, 7}} {
		g.CurrentTurn.BroadcastRevealedLetter(g, step.remaining)
		count := 0
		for _, r := range g.CurrentTurn.RevealedLetters {
			if r != '_' {
				count++
			}
		}
		if count != step.want {
			t.Fatalf("remaining=%d: got %d reveals, want %d", step.remaining, count, step.want)
		}
	}
	found := false
	for len(m.messages) > 0 {
		var message struct {
			Type    string          `json:"type"`
			Payload json.RawMessage `json:"payload"`
		}
		if err := json.Unmarshal(<-m.messages, &message); err != nil {
			t.Fatal(err)
		}
		if message.Type == "revealedLetters" {
			var payload struct {
				Letters []int `json:"letters"`
			}
			if err := json.Unmarshal(message.Payload, &payload); err != nil {
				t.Fatal(err)
			}
			if len(payload.Letters) != 10 {
				t.Fatal("reveal payload does not match frontend contract")
			}
			found = true
		}
	}
	if !found {
		t.Fatal("no letter updates published")
	}
}

func TestWordSelectionDurationJSON(t *testing.T) {
	var options shared.GameOptions
	if err := json.Unmarshal([]byte(`{"selectWordTimeLimit":25}`), &options); err != nil {
		t.Fatal(err)
	}
	if options.WordSelectTimeLimit != 25 {
		t.Fatalf("word selection duration = %d, want 25", options.WordSelectTimeLimit)
	}
}

func TestReadyToggleBroadcastsAuthoritativeState(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	m := &revealMessenger{messages: make(chan []byte, 32)}
	g := game.NewGame(ctx, "ready-test", shared.GameOptions{}, m, nil)
	g.Players["player"] = &shared.Player{ID: "player"}
	g.PlayerOrder = []string{"player"}
	g.InitGameEvents()
	for _, want := range []bool{true, false} {
		g.GameEvents[events.PlayerToggleReady](json.RawMessage(`{"playerID":"player"}`))
		var message struct {
			Type    string         `json:"type"`
			Payload game.GameState `json:"payload"`
		}
		select {
		case raw := <-m.messages:
			if err := json.Unmarshal(raw, &message); err != nil {
				t.Fatal(err)
			}
		case <-time.After(time.Second):
			t.Fatal("ready change did not broadcast")
		}
		if message.Type != "gameState" || len(message.Payload.Players) != 1 || message.Payload.Players[0].Ready != want {
			t.Fatalf("unexpected ready snapshot: %+v", message)
		}
	}
}
