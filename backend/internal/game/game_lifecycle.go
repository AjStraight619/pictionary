package game

import (
	"log"

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

	// Timer producers stop through context cancellation; never close their input channel.
	g.Status = Finished

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
	select {
	case g.FlowSignal <- GameStarted:
	case <-g.ctx.Done():
	}
}
