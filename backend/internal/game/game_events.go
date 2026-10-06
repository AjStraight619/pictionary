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
			g.Mu.Lock()
			timer := g.timers[pt.TimerType]
			if g.Status != NotStarted || timer == nil {
				g.Mu.Unlock()
				return
			}
			delete(g.timers, pt.TimerType)
			g.Mu.Unlock()
			timer.Cancel()
			if b, err := utils.CreateMessage("startGameCountdown", map[string]any{"timeRemaining": nil}); err == nil {
				g.Messenger.BroadcastMessage(b)
			}
		}
	})

	g.RegisterGameEvent(e.SelectWord, func(payload json.RawMessage) {
		var pt e.SelectWordPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling SelectWord payload:", err)
			return
		}

		g.completeWordSelection(pt.Word)
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
		g.updatePlayerReady(pt.PlayerID, false)
	})

	g.RegisterGameEvent(e.PlayerToggleReady, func(payload json.RawMessage) {
		var pt e.PlayerToggleReadyPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling PlayerToggleReady payload:", err)
			return
		}
		g.updatePlayerReady(pt.PlayerID, true)
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

	if event.Type == e.StartTimer || event.Type == e.StopTimer {
		g.Mu.RLock()
		player := g.Players[event.PlayerID]
		permitted := player != nil && player.IsHost
		g.Mu.RUnlock()
		if !permitted {
			return
		}
	}
	if event.Type == e.SelectWord {
		g.Mu.RLock()
		permitted := g.CurrentTurn.CurrentDrawerID == event.PlayerID
		g.Mu.RUnlock()
		if !permitted {
			return
		}
	}

	if exists {
		log.Printf("Dispatching custom handler for event type: %s", event.Type)
		handler(event.Payload)
		return
	} else {
		log.Printf("No handler registered for game event: %s", event.Type)
	}
}

// Ready changes and snapshots share the same lock so all clients see a consistent value.
func (g *Game) updatePlayerReady(playerID string, toggle bool) {
	g.Mu.Lock()
	player := g.Players[playerID]
	if player == nil || g.Status != NotStarted {
		g.Mu.Unlock()
		return
	}
	if toggle {
		player.Ready = !player.Ready
	} else {
		player.Ready = true
	}
	g.Mu.Unlock()
	g.BroadcastGameState()
}
