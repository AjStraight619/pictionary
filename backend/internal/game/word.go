package game

import (
	"log"
	"math/rand"

	"github.com/Ajstraight619/pictionary-server/internal/db"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type WordSelector struct {
	game *Game
}

type WordSelectionPayload struct {
	IsSelectingWord bool          `json:"isSelectingWord"`
	SelectableWords []shared.Word `json:"selectableWords"`
}

func NewWordSelector(game *Game) *WordSelector {
	return &WordSelector{game: game}
}

func (ws *WordSelector) SelectWord() {
	ws.game.setIsSelectingWord(true)
	if err := ws.game.setRandomWords(3); err != nil {
		log.Println("error getting random words:", err)
		return
	}

	selectionPayload := WordSelectionPayload{
		IsSelectingWord: true,
		SelectableWords: ws.game.CurrentTurn.SelectableWords,
	}

	b, err := utils.CreateMessage("openSelectWordModal", selectionPayload)
	if err != nil {
		log.Println("error marshalling message:", err)
		return
	}
	currentDrawer := ws.game.Round.GetCurrentDrawer(ws.game.Players, ws.game.PlayerOrder)
	if currentDrawer == nil {
		log.Println("No current drawer found.")
		return
	}
	ws.game.Messenger.SendToPlayer(currentDrawer.ID, b)
	ws.game.BroadcastGameState()
	ws.game.TimerManager.StartWordSelectionTimer(currentDrawer.ID)
}

func (g *Game) setWord(word *shared.Word) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	g.CurrentTurn.WordToGuess = word
}

func (g *Game) setIsSelectingWord(selecting bool) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	g.CurrentTurn.IsSelectingWord = selecting
}

func (g *Game) setRandomWords(n int) error {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	words, err := db.GetRandomWords(n)
	if err != nil {
		return err
	}
	g.CurrentTurn.SelectableWords = words
	return nil
}

func (g *Game) clearSelectableWords() {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	g.CurrentTurn.SelectableWords = []shared.Word{}
}

func (g *Game) handleTimerExpiration() {
	g.Mu.RLock()
	turn := g.CurrentTurn
	if !turn.IsSelectingWord || len(turn.SelectableWords) == 0 {
		g.Mu.RUnlock()
		return
	}
	word := turn.SelectableWords[rand.Intn(len(turn.SelectableWords))]
	g.Mu.RUnlock()
	g.completeWordSelection(word)
}

// Manual selection and expiry compete for the same state transition.
func (g *Game) completeWordSelection(word shared.Word) {
	g.Mu.Lock()
	turn := g.CurrentTurn
	if !turn.IsSelectingWord {
		g.Mu.Unlock()
		return
	}
	var selected *shared.Word
	for _, choice := range turn.SelectableWords {
		if choice.Id == word.Id {
			copy := choice
			selected = &copy
			break
		}
	}
	if selected == nil {
		g.Mu.Unlock()
		return
	}
	turn.WordToGuess = selected
	turn.IsSelectingWord = false
	turn.SelectableWords = nil
	drawerID := turn.CurrentDrawerID
	g.Mu.Unlock()
	g.CancelTimer("selectWordTimer")
	if b, err := utils.CreateMessage("selectedWord", map[string]any{"word": selected, "isSelectingWord": false}); err == nil {
		g.Messenger.SendToPlayer(drawerID, b)
	}
	g.BroadcastGameState()
	select {
	case g.FlowSignal <- TurnStarted:
	case <-g.ctx.Done():
	}
}
