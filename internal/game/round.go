package game

import (
	"log"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type Round struct {
	CurrentDrawerIdx int
	Count            int
	PlayersDrawn     []string
	CurrentDrawerID  string
}

func NewRound() *Round {
	return &Round{
		CurrentDrawerIdx: 0,
		Count:            0,
		PlayersDrawn:     []string{},
	}
}

func (r *Round) Start(g *Game) {
	g.Mu.Lock()
	defer g.Mu.Unlock()

	// Reset round state or create a new round if needed.
	if r == nil {
		r = NewRound()
	} else {
		r.Count++
		r.CurrentDrawerIdx = 0
		r.PlayersDrawn = []string{}
	}
	if len(g.PlayerOrder) > 0 {
		firstID := g.PlayerOrder[0]
		g.Players[firstID].IsDrawing = true
		r.CurrentDrawerID = firstID

		msgType := "drawingPlayerChanged"
		payload := g.Players[firstID]
		if b, err := utils.CreateMessage(msgType, payload); err == nil {
			g.Messenger.BroadcastMessage(b)
		} else {
			log.Println("error marshalling message:", err)
		}
	}
	g.FlowSignal <- TurnStarted
}

func (r *Round) Next(g *Game) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	r.Count++
	r.CurrentDrawerIdx = 0
	r.PlayersDrawn = []string{}
	g.FlowSignal <- TurnStarted
}

func (r *Round) NextDrawer(g *Game) *shared.Player {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	if len(g.PlayerOrder) == 0 {
		return nil
	}
	r.CurrentDrawerIdx = (r.CurrentDrawerIdx + 1) % len(g.PlayerOrder)
	newID := g.PlayerOrder[r.CurrentDrawerIdx]
	g.Players[newID].IsDrawing = true
	r.CurrentDrawerID = newID

	msgType := "drawingPlayerChanged"
	payload := g.Players[newID]
	if b, err := utils.CreateMessage(msgType, payload); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Println("error marshalling message:", err)
	}
	return g.Players[newID]
}

func (r *Round) MarkPlayerAsDrawn(playerID string) {
	// Avoid duplicate entries.
	for _, id := range r.PlayersDrawn {
		if id == playerID {
			return
		}
	}
	r.PlayersDrawn = append(r.PlayersDrawn, playerID)
}
