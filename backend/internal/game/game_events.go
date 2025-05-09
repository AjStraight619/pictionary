package game

import (
	"encoding/json"
	"log"

	e "github.com/Ajstraight619/pictionary-server/internal/events"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type EventHandler func(json.RawMessage)

func (g *Game) RegisterGameEvent(eventType string, handler EventHandler) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	g.GameEvents[eventType] = handler

}

// InitGameEvents registers the default event handlers for a game.
func (g *Game) InitGameEvents() {

	g.RegisterGameEvent(e.StartTimer, func(payload json.RawMessage) {
		var pt e.StartTimerPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling StartTimer payload:", err)
			return
		}
		if pt.TimerType == "startGameCountdown" {
			g.TimerManager.StartGameCountdown(pt.TimerType, 5)
		}
	})

	g.RegisterGameEvent(e.StopTimer, func(payload json.RawMessage) {
		var pt e.StopTimerPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling StopTimer payload:", err)
			return
		}

		if pt.TimerType == "startGameCountdown" {
			g.CancelTimer(pt.TimerType)
			g.Mu.Lock()
			g.Status = NotStarted
			g.Mu.Unlock()
		}
	})

	g.RegisterGameEvent(e.SelectWord, func(payload json.RawMessage) {
		var pt e.SelectWordPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling SelectWord payload:", err)
			return
		}

		g.CancelTimer("selectWordTimer")
		g.setIsSelectingWord(false)
		g.setWord(&pt.Word)

		selectWordPayload := map[string]any{
			"word":            g.CurrentTurn.WordToGuess,
			"isSelectingWord": false,
		}

		b, err := utils.CreateMessage("selectedWord", selectWordPayload)
		if err != nil {
			log.Println("error marshalling selectedWord message:", err)
			return
		}
		currentDrawer := g.Round.GetCurrentDrawer(g.Players, g.PlayerOrder)
		g.Messenger.SendToPlayer(currentDrawer.ID, b)
		g.BroadcastGameState()
		g.FlowSignal <- TurnStarted
	})

	g.RegisterGameEvent(e.GameState, func(payload json.RawMessage) {
		var pt e.GameStatePayload

		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling GameState payload:", err)
			return
		}

		playerID := pt.PlayerID

		b, err := utils.CreateMessage("gameState", g.GetGameState())
		if err != nil {
			log.Println("error marshalling game state:", err)
			return
		}

		g.Messenger.SendToPlayer(playerID, b)
	})

	g.RegisterGameEvent(e.PlayerGuess, func(payload json.RawMessage) {
		var pt e.PlayerGuessPayload

		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling PlayerGuess payload:", err)
			return
		}

		g.handlePlayerGuess(pt.PlayerID, pt.Guess)
	})

	g.RegisterGameEvent(e.PlayerReady, func(payload json.RawMessage) {
		var pt e.PlayerReadyPayload

		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling PlayerReady payload:", err)
			return
		}

		player := g.GetPlayerByID(pt.PlayerID)
		if player == nil {
			log.Printf("Player with ID %s not found", pt.PlayerID)
			return
		}

		player.Ready = true
		log.Printf("Player %s (%s) is now ready", player.Username, player.ID)

		g.BroadcastGameState()

	})

	g.RegisterGameEvent(e.PlayerToggleReady, func(payload json.RawMessage) {
		var pt e.PlayerToggleReadyPayload

		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling PlayerToggleReady payload:", err)
			return
		}

		player := g.GetPlayerByID(pt.PlayerID)
		if player == nil {
			log.Printf("Player with ID %s not found", pt.PlayerID)
			return
		}

		player.Ready = !player.Ready
		log.Printf("Player %s (%s) ready state toggled to: %v", player.Username, player.ID, player.Ready)

		g.BroadcastGameState()

	})

	g.RegisterGameEvent(e.CursorUpdate, func(payload json.RawMessage) {
		var pt e.CursorUpdatePayload

		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling CursorUpdate payload:", err)
			return
		}

		// ! Actual implementation: g.Messenger.SendToOthers(pt.PlayerID, payload)

		// For testing with myself..
		g.Messenger.SendToPlayer(pt.PlayerID, payload)
	})

	g.RegisterGameEvent(e.RemovePlayer, func(payload json.RawMessage) {
		var pt e.RemovePlayerPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling RemovePlayer payload:", err)
			return
		}

		log.Printf("Payload: %+v", pt)

		g.RemovePlayerByHost(pt.PlayerID, pt.HostID)
	})

}

func (g *Game) handleExternalEvent(event e.GameEvent) {
	// Update the last activity timestamp for the game
	g.UpdateLastActivity()

	g.Mu.RLock()
	handler, exists := g.GameEvents[event.Type]
	g.Mu.RUnlock()

	if exists {
		log.Printf("Dispatching custom handler for event type: %s", event.Type)
		go handler(event.Payload)
		return
	} else {
		log.Printf("No handler registered for game event: %s", event.Type)
	}
}
