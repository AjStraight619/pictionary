package game

import (
	"log"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type TimerManager struct {
	game *Game
}

func NewTimerManager(game *Game) *TimerManager {
	return &TimerManager{game: game}
}

func (tm *TimerManager) StartTurnTimer(playerID string) {
	timer := NewTimer("turnTimer", 10)
	tm.game.timers["turnTimer"] = timer

	onCancel := func() {
		// log.Println("Turn timer cancelled")
		// tm.game.Round.MarkPlayerAsDrawn(playerID)
		// tm.game.setWord(nil)
		// tm.game.BroadcastGameState()
		tm.game.FlowSignal <- TurnEnded
	}
	onFinish := func() {
		// log.Println("Turn timer finished")
		// tm.game.Round.MarkPlayerAsDrawn(playerID)
		// tm.game.setWord(nil)
		// tm.game.BroadcastGameState()
		tm.game.FlowSignal <- TurnEnded
	}
	go func() {
		for remaining := range timer.StartCountdown(onFinish, onCancel) {
			msgType := "turnTimer"
			payload := map[string]interface{}{
				"timeRemaining": remaining,
			}
			if b, err := utils.CreateMessage(msgType, payload); err == nil {
				tm.game.Messenger.BroadcastMessage(b)
			} else {
				log.Println("error marshalling turnTimer message:", err)
			}
		}
	}()
}

func (tm *TimerManager) StartWordSelectionTimer(playerID string) {
	timer := NewTimer("selectWordTimer", 8)
	tm.game.timers["selectWordTimer"] = timer
	log.Println("Word selection timer started.")

	go func() {
		// To control pacing of game. Small delays in between different game actions and state updates.
		time.Sleep(1 * time.Second)
		for remaining := range timer.StartCountdown(
			func() {
				tm.game.handleTimerExpiration()
			},
			func() {
				log.Println("Word selection cancelled. Timer stopped.")
			},
		) {
			payload := map[string]interface{}{
				"timeRemaining": remaining,
			}
			if b, err := utils.CreateMessage("selectWordTimer", payload); err == nil {
				tm.game.Messenger.SendToPlayer(playerID, b)
			} else {
				log.Println("error marshalling selectWordTimer message:", err)
			}
		}
		log.Println("Word selection timer ended.")
	}()
}
