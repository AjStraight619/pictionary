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
	tm.game.Mu.Lock()
	tm.game.timers[timerType] = timer
	tm.game.Mu.Unlock()

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
	tm.game.CancelTimer("turnTimer")

	tm.game.Mu.RLock()
	timeLimit := tm.game.Options.TurnTimeLimit
	tm.game.Mu.RUnlock()

	timer := NewTimer(tm.game.ctx, "turnTimer", timeLimit)

	tm.game.Mu.Lock()
	tm.game.timers["turnTimer"] = timer
	tm.game.Mu.Unlock()

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

			tm.game.CurrentTurn.BroadcastRevealedLetter(tm.game, remaining)
		}
	}()
}

func (tm *TimerManager) StartWordSelectionTimer(playerID string) {
	tm.game.CancelTimer("selectWordTimer")

	tm.game.Mu.RLock()
	timeLimit := tm.game.Options.WordSelectTimeLimit
	tm.game.Mu.RUnlock()

	log.Printf("DEBUG: Creating word selection timer with duration: %d seconds", timeLimit)

	if timeLimit <= 0 {
		log.Printf("ERROR: Invalid word selection time limit: %d, using default", timeLimit)
		timeLimit = 10 // Fallback to a default value
	}

	timer := NewTimer(tm.game.ctx, "selectWordTimer", timeLimit)

	tm.game.Mu.Lock()
	tm.game.timers["selectWordTimer"] = timer
	tm.game.Mu.Unlock()

	timerID := timer // Store a reference to this specific timer instance

	// Start countdown with callbacks that verify they're still the active timer
	go func() {
		time.Sleep(1 * time.Second)
		for remaining := range timer.StartCountdown(
			func() {
				// Verify this timer is still the active one before running callbacks
				tm.game.Mu.RLock()
				currentTimer, exists := tm.game.timers["selectWordTimer"]
				isStillActive := exists && currentTimer == timerID
				tm.game.Mu.RUnlock()

				log.Printf("Word selection timer finished (still active: %v)", isStillActive)
				if isStillActive {
					tm.game.handleTimerExpiration()
				}
			},
			func() {
				log.Println("Word selection cancelled. Timer stopped.")
			},
		) {
			// Timer tick code...
			payload := map[string]interface{}{
				"timeRemaining": remaining,
			}
			if b, err := utils.CreateMessage("selectWordTimer", payload); err == nil {
				tm.game.Messenger.SendToPlayer(playerID, b)
			}
		}
		log.Println("Word selection timer ended.")
	}()
}
