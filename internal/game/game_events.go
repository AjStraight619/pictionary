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
	// Send game state to the player when their visibility changes (joining, tabbing back in, etc.)
	g.RegisterGameEvent(e.GameState, func(payload json.RawMessage) {
		var pt e.GameStatePayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling GameState payload:", err)
			return
		}

		state := g.GetGameState()
		b, err := json.Marshal(map[string]interface{}{
			"type":    "gameState",
			"payload": state,
		})
		if err != nil {
			log.Println("error marshalling game state:", err)

		}
		g.Messenger.SendToPlayer(pt.PlayerID, b)

	})
	g.RegisterGameEvent(e.StartTimer, func(payload json.RawMessage) {
		var pt e.StartTimerPayload
		if err := json.Unmarshal(payload, &pt); err != nil {
			log.Println("Error unmarshalling StartTimer payload:", err)
			return
		}
		if pt.TimerType == "startGameCountdown" {
			g.StartGameCountdown(pt.TimerType, 5)
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
		currentDrawer := g.GetCurrentDrawer()
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

}
