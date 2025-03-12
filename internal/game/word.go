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
		SelectableWords: ws.game.SelectableWords,
	}

	msgType := "openSelectWordModal"
	b, err := utils.CreateMessage(msgType, selectionPayload)
	if err != nil {
		log.Println("error marshalling message:", err)
		return
	}
	currentDrawer := ws.game.GetCurrentDrawer()
	if currentDrawer == nil {
		log.Println("No current drawer found.")
		return
	}
	ws.game.Messenger.SendToPlayer(currentDrawer.ID, b)
	ws.game.TimerManager.StartWordSelectionTimer(currentDrawer.ID)
}

func (g *Game) setIsSelectingWord(selecting bool) {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	g.isSelectingWord = selecting
}

func (g *Game) setRandomWords(n int) error {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	words, err := db.GetRandomWords(n)
	if err != nil {
		return err
	}
	g.SelectableWords = words
	return nil
}

func (g *Game) handleTimerExpiration() {
	if len(g.SelectableWords) > 0 {
		g.Mu.Lock()
		randomIndex := rand.Intn(len(g.SelectableWords))
		randomWord := g.SelectableWords[randomIndex]
		log.Printf("Timer finished. Automatically selecting word: %s", randomWord.Word)
		g.CurrentTurn.WordToGuess = &randomWord
		g.isSelectingWord = false
		g.Mu.Unlock()
		selectWordPayload := map[string]interface{}{
			"word":            g.CurrentTurn.WordToGuess,
			"isSelectingWord": false,
		}

		b, err := utils.CreateMessage("selectedWord", selectWordPayload)
		if err != nil {
			log.Println("error marshalling selectedWord message:", err)
			return
		}
		currentDrawer := g.GetCurrentDrawer()
		g.Messenger.SendToPlayer(currentDrawer.ID, b)
		g.BroadcastGameState()
		time.AfterFunc(1*time.Second, func() {
			g.FlowSignal <- TurnStarted
		})
	} else {
		log.Println("Timer finished but no selectable words available.")
	}
}
