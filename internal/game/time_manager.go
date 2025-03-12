package game

import (
	"github.com/Ajstraight619/pictionary-server/internal/utils"
	"log"
	"time"
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
		log.Println("Turn timer cancelled")
		tm.game.Round.MarkPlayerAsDrawn(playerID)
		tm.game.BroadcastGameState()
	}
	onFinish := func() {
		log.Println("Turn timer finished")
		tm.game.Round.MarkPlayerAsDrawn(playerID)
		tm.game.BroadcastGameState()
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
	timer := NewTimer("selectWordTimer", 30)
	tm.game.timers["selectWordTimer"] = timer
	log.Println("Word selection timer started.")

	go func() {
		time.Sleep(2 * time.Second)
		for remaining := range timer.StartCountdown(
			func() {
				tm.game.handleTimerExpiration()
			},
			func() {
				log.Println("Word selection cancelled. Timer stopped.")
			},
		) {
			msgType := "selectWordTimer"
			payload := map[string]interface{}{
				"timeRemaining": remaining,
			}
			if b, err := utils.CreateMessage(msgType, payload); err == nil {
				tm.game.Messenger.SendToPlayer(playerID, b)
			} else {
				log.Println("error marshalling selectWordTimer message:", err)
			}
		}
		log.Println("Word selection timer ended.")
	}()
}
