package game

import (
	"log"
	"slices"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type Round struct {
	CurrentDrawerIdx int      `json:"-"`
	Count            int      `json:"count"`
	PlayersDrawn     []string `json:"playersDrawn"`
	CurrentDrawerID  string   `json:"currentDrawerID"`
}

func InitRound() *Round {
	return &Round{
		CurrentDrawerIdx: 0,
		Count:            0,
		PlayersDrawn:     []string{},
		CurrentDrawerID:  "",
	}
}

func (r *Round) Reset() {
	r.Count++
	r.CurrentDrawerIdx = 0
	r.PlayersDrawn = []string{}
	r.CurrentDrawerID = ""
}

func (r *Round) Start(g *Game) {
	g.Mu.Lock()
	defer g.Mu.Unlock()

	if r.Count == 0 { // Only set the count on the very first round.
		r.Count = 1
	}
	r.setInitialDrawer(g)
	g.FlowSignal <- TurnStarted
}

func (r *Round) Next(g *Game) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	r.Reset()
	g.FlowSignal <- RoundStarted
}

func (r *Round) setInitialDrawer(g *Game) {
	if len(g.PlayerOrder) == 0 {
		return
	}
	firstID := g.PlayerOrder[0]
	if player, exists := g.Players[firstID]; exists {
		player.IsDrawing = true
		r.CurrentDrawerID = firstID
		r.CurrentDrawerIdx = 0
		g.CurrentTurn = NewTurn(firstID)
		msgType := "drawingPlayerChanged"
		if b, err := utils.CreateMessage(msgType, player); err == nil {
			g.Messenger.BroadcastMessage(b)
		} else {
			log.Println("error marshalling message:", err)
		}
	} else {
		log.Printf("setInitialDrawer: Player %s not found in players map", firstID)
	}
}

func (r *Round) NextDrawer(g *Game) *shared.Player {
	g.Mu.Lock()
	defer g.Mu.Unlock()

	if len(g.PlayerOrder) == 0 {
		return nil
	}
	// Move to the next drawer.
	r.CurrentDrawerIdx = (r.CurrentDrawerIdx + 1) % len(g.PlayerOrder)
	newID := g.PlayerOrder[r.CurrentDrawerIdx]

	// Check if the player exists
	nextPlayer, exists := g.Players[newID]
	if !exists {
		log.Printf("NextDrawer: Player %s not found in players map", newID)
		return nil
	}

	// Create a new turn for the new drawer.
	g.CurrentTurn = NewTurn(newID)

	// Set the new drawer as active.
	nextPlayer.IsDrawing = true
	r.CurrentDrawerID = newID

	// Broadcast the change.
	if b, err := utils.CreateMessage("drawingPlayerChanged", nextPlayer); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Println("error marshalling message:", err)
	}
	return nextPlayer
}

func (r *Round) GetCurrentDrawer(players map[string]*shared.Player, playerOrder []string) *shared.Player {
	if len(playerOrder) == 0 {
		return nil
	}
	currentID := playerOrder[r.CurrentDrawerIdx]
	return players[currentID]
}

func (r *Round) MarkPlayerAsDrawn(playerID string) {
	if slices.Contains(r.PlayersDrawn, playerID) {
		return
	}
	r.PlayersDrawn = append(r.PlayersDrawn, playerID)
}

func (r *Round) IsOver(g *Game) bool {
	return len(r.PlayersDrawn) == len(g.PlayerOrder)
}

func (r *Round) UnmarkAllPlayersAsDrawn() {
	r.PlayersDrawn = []string{}
} // Default to adding test players if env is not set
