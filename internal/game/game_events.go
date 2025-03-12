package game

import (
	"encoding/json"
	"log"
	"time"

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
		g.Mu.Lock()

		g.CurrentTurn.WordToGuess = &pt.Word
		g.isSelectingWord = false
		g.Mu.Unlock()
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

		time.AfterFunc(1*time.Second, func() {
			g.FlowSignal <- TurnStarted
		})
	})

}
