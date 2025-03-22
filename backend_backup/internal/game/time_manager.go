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

func (tm *TimerManager) StartGameCountdown(timerType string, duration int) {
	timer := NewTimer(tm.game.ctx, timerType, duration)
	tm.game.timers[timerType] = timer

	onFinish := func() {
		log.Println("Game countdown finished")
		tm.game.Mu.Lock()
		tm.game.Status = InProgress
		tm.game.Mu.Unlock()
		tm.game.Start()
	}

	onCancel := func() {
		log.Println("Game countdown cancelled")
		tm.game.Mu.Lock()
		tm.game.Status = NotStarted
		tm.game.Mu.Unlock()
		tm.game.CancelTimer(timerType)
	}

	go func() {
		for remaining := range timer.StartCountdown(onFinish, onCancel) {
			msgType := "startGameCountdown"
			payload := map[string]interface{}{
				"timeRemaining": remaining,
			}
			log.Println("Broadcasting game countdown:", remaining)

			b, err := utils.CreateMessage(msgType, payload)
			if err != nil {
				log.Println("error marshalling message")
				return
			}
			tm.game.Messenger.BroadcastMessage(b)
		}
	}()
}

func (tm *TimerManager) StartTurnTimer(playerID string) {
	timer := NewTimer(tm.game.ctx, "turnTimer", 10)
	tm.game.timers["turnTimer"] = timer

	onCancel := func() {
		tm.game.FlowSignal <- TurnEnded
	}
	onFinish := func() {
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
	timer := NewTimer(tm.game.ctx, "selectWordTimer", 8)
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
