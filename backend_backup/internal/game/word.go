package game

import (
	"log"
	"math/rand"
	"time"

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
	if len(g.CurrentTurn.SelectableWords) > 0 {
		g.Mu.Lock()
		randomIndex := rand.Intn(len(g.CurrentTurn.SelectableWords))
		randomWord := g.CurrentTurn.SelectableWords[randomIndex]
		log.Printf("Timer finished. Automatically selecting word: %s", randomWord.Word)
		g.Mu.Unlock()

		g.setWord(&randomWord)
		g.setIsSelectingWord(false)
		g.clearSelectableWords()

		selectWordPayload := map[string]interface{}{
			"word":            g.CurrentTurn.WordToGuess,
			"isSelectingWord": false,
		}

		b, err := utils.CreateMessage("selectedWord", selectWordPayload)
		if err != nil {
			log.Println("error marshalling selectedWord message:", err)
			return
		}
		currentDrawer := g.Round.GetCurrentDrawer(g.Players, g.PlayerOrder)
		g.Messenger.SendToPlayer(currentDrawer.ID, b)
		g.BroadcastGameState()
		time.AfterFunc(1*time.Second, func() {
			g.FlowSignal <- TurnStarted
		})
	} else {
		log.Println("Timer finished but no selectable words available.")
	}
}
