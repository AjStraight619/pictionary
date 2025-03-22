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

	// Cancel all timers
	for _, timer := range g.timers {
		timer.Cancel()
	}

	// Close channels safely
	if g.FlowSignal != nil {
		close(g.FlowSignal)
	}

	// Clear all game state
	g.Status = Finished

	// Notify all players BEFORE we clear state
	message := map[string]interface{}{
		"type":    "gameEnded",
		"message": "Game has been terminated",
	}
	if b, err := utils.CreateMessage("gameEnded", message); err == nil {
		g.Messenger.BroadcastMessage(b)
	}

	// Notify lifecycle handler that game is done
	if g.lifecycle != nil {
		g.lifecycle.OnGameEnded(g.ID)
	}
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
			// The game is being shut down
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
