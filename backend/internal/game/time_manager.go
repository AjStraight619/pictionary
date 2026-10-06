package game

import (
	"log"

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
	if tm.game.Status != NotStarted || tm.game.timers[timerType] != nil {
		tm.game.Mu.Unlock()
		return
	}
	tm.game.timers[timerType] = timer
	tm.game.Mu.Unlock()

	onFinish := func() {
		log.Println("Game countdown finished")
		tm.game.Mu.Lock()
		if tm.game.timers[timerType] != timer {
			tm.game.Mu.Unlock()
			return
		}
		delete(tm.game.timers, timerType)
		tm.game.Status = InProgress
		tm.game.Mu.Unlock()
		tm.game.Start()
	}

	onCancel := func() {} // Explicit cancellation publishes its state in the game event handler.

	go func() {
		for remaining := range timer.StartCountdown(onFinish, onCancel) {
			tm.publishTick(timerType, timer, remaining, "")
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

	onCancel := func() {} // Ending/cancelling a turn must not queue a second TurnEnded.
	onFinish := func() {
		tm.game.Mu.Lock()
		active := tm.game.timers["turnTimer"] == timer
		if active {
			delete(tm.game.timers, "turnTimer")
		}
		tm.game.Mu.Unlock()
		if active {
			select {
			case tm.game.FlowSignal <- TurnEnded:
			case <-tm.game.ctx.Done():
			}
		}
	}

	go func() {
		for remaining := range timer.StartCountdown(onFinish, onCancel) {
			tm.publishTick("turnTimer", timer, remaining, "")

			tm.game.Mu.RLock()
			turn := tm.game.CurrentTurn
			active := tm.game.timers["turnTimer"] == timer
			tm.game.Mu.RUnlock()
			if active {
				turn.BroadcastRevealedLetter(tm.game, remaining)
			}
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
			tm.publishTick("selectWordTimer", timer, remaining, playerID)
		}
		log.Println("Word selection timer ended.")
	}()
}

// Keep cancellation and tick delivery ordered: a stopped timer cannot publish again.
func (tm *TimerManager) publishTick(name string, timer *Timer, remaining int, playerID string) {
	tm.game.Mu.RLock()
	defer tm.game.Mu.RUnlock()
	if tm.game.timers[name] != timer {
		return
	}
	b, err := utils.CreateMessage(name, map[string]any{"timeRemaining": remaining})
	if err != nil {
		return
	}
	if playerID == "" {
		tm.game.Messenger.BroadcastMessage(b)
	} else {
		tm.game.Messenger.SendToPlayer(playerID, b)
	}
}
