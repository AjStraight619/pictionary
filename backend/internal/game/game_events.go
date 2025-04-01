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

		log.Printf("Word selected manually: %s", pt.Word.Word)

		g.CancelTimer("selectWordTimer")
		g.setIsSelectingWord(false)
		g.setWord(&pt.Word)
		log.Printf("Word selected manually: %s", pt.Word.Word)

		selectWordPayload := map[string]interface{}{
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

		// Mark the player as ready
		player := g.GetPlayerByID(pt.PlayerID)
		if player == nil {
			log.Printf("Player with ID %s not found", pt.PlayerID)
			return
		}

		player.Ready = true
		log.Printf("Player %s (%s) is now ready", player.Username, player.ID)

		g.BroadcastGameState()

		// Check if all players are ready
		allReady := true
		g.Mu.RLock()
		for _, p := range g.Players {
			if !p.Ready {
				allReady = false
				break
			}
		}
		g.Mu.RUnlock()

		// If all players are ready and there's at least 2 players, host can start the game
		if allReady && len(g.Players) >= 2 {
			log.Println("All players are ready, host can start the game")
		}
	})

	g.RegisterGameEvent(e.PlayerToggleReady, func(payload json.RawMessage) {
		var pt e.PlayerToggleReadyPayload

		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling PlayerToggleReady payload:", err)
			return
		}

		// Get the player
		player := g.GetPlayerByID(pt.PlayerID)
		if player == nil {
			log.Printf("Player with ID %s not found", pt.PlayerID)
			return
		}

		// Toggle the ready state
		player.Ready = !player.Ready
		log.Printf("Player %s (%s) ready state toggled to: %v", player.Username, player.ID, player.Ready)

		// Broadcast the updated game state
		g.BroadcastGameState()

		// Check if all players are ready
		allReady := true
		g.Mu.RLock()
		for _, p := range g.Players {
			if !p.Ready {
				allReady = false
				break
			}
		}
		g.Mu.RUnlock()

		// If all players are ready and there's at least 2 players, host can start the game
		if allReady && len(g.Players) >= 2 {
			log.Println("All players are ready, host can start the game")
		}
	})

}

func (g *Game) handleExternalEvent(event e.GameEvent) {
	g.Mu.RLock()
	handler, exists := g.GameEvents[event.Type]
	g.Mu.RUnlock()

	if exists {
		log.Printf("Dispatching custom handler for event type: %s", event.Type)
		go handler(event.Payload)
		return
	}
}
