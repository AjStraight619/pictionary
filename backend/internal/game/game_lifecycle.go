package game

import (
	"log"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type GameLifecycle interface {
	OnGameEnded(gameID string)
}

func (g *Game) cleanup() {
	g.Mu.Lock()
	defer g.Mu.Unlock()

	log.Printf("Cleaning up game %s...", g.ID)

	// Cancel all timers
	for timerName, timer := range g.timers {
		log.Printf("Cancelling timer: %s", timerName)
		timer.Cancel()
	}
	g.timers = make(map[string]*Timer)

	// Safe channel closing with protection against double-close
	if g.FlowSignal != nil {
		// Use recover in case channel is already closed
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic while closing FlowSignal channel: %v", r)
			}
		}()

		// Mark game as finished
		g.Status = Finished

		select {
		case _, ok := <-g.FlowSignal:
			if ok {
				close(g.FlowSignal)
				g.FlowSignal = nil
				log.Println("FlowSignal channel closed successfully")
			} else {
				log.Println("FlowSignal channel was already closed")
			}
		default:
			close(g.FlowSignal)
			g.FlowSignal = nil
			log.Println("FlowSignal channel closed successfully")
		}
	}

	// Notify all players BEFORE we clear state
	message := map[string]interface{}{
		"type":    "gameEnded",
		"message": "Game has been terminated",
	}
	if b, err := utils.CreateMessage("gameEnded", message); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Printf("Error creating gameEnded message: %v", err)
	}

	// Notify lifecycle handler that game is done
	if g.lifecycle != nil {
		g.lifecycle.OnGameEnded(g.ID)
	}

	log.Printf("Game %s cleanup completed", g.ID)
}

func (g *Game) Run() {
	defer g.cleanup()

	for {
		select {
		case flow := <-g.FlowSignal:
			g.FlowManager.HandleFlow(flow)
		case event := <-g.Messenger.GameEventChannel():
			g.handleExternalEvent(event)
		case <-g.ctx.Done():
			log.Printf("Game %s is shutting down...", g.ID)
			return
		}
	}
}

func (g *Game) Start() {
	g.BroadcastGameState()
	time.AfterFunc(2*time.Second, func() {
		g.FlowSignal <- GameStarted
	})
}
