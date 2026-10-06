package game

import (
	"log"
	"math/rand"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type TurnPhase int

const (
	PhaseWordSelection TurnPhase = iota
	PhaseDrawing
)

type Turn struct {
	CurrentDrawerID         string          `json:"currentDrawerID"`
	WordToGuess             *shared.Word    `json:"wordToGuess,omitempty"`
	RevealedLetters         []rune          `json:"revealedLetters"`
	PlayersGuessedCorrectly map[string]bool `json:"playersGuessedCorrectly"`
	Phase                   TurnPhase       `json:"phase"`
	IsSelectingWord         bool            `json:"isSelectingWord"`
	SelectableWords         []shared.Word   `json:"selectableWords,omitempty"`
	revealedCount           int             `json:"-"`
	unrevealedIndices       []int           `json:"-"`
}

func InitTurn() *Turn {
	return &Turn{
		CurrentDrawerID:         "",
		PlayersGuessedCorrectly: make(map[string]bool),
		RevealedLetters:         make([]rune, 0),
		WordToGuess:             nil,
		Phase:                   PhaseWordSelection,
		SelectableWords:         make([]shared.Word, 0),
	}
}

func NewTurn(playerID string) *Turn {
	return &Turn{
		CurrentDrawerID:         playerID,
		PlayersGuessedCorrectly: make(map[string]bool),
		RevealedLetters:         make([]rune, 0),
		WordToGuess:             nil,
		Phase:                   PhaseWordSelection,
		SelectableWords:         make([]shared.Word, 0),
	}
}

func (t *Turn) Start(g *Game, playerID string) {
	g.Mu.Lock()
	log.Printf("WORD: At turn start, word is: %v",
		t.WordToGuess)

	letters := []rune(g.CurrentTurn.WordToGuess.Word)
	t.RevealedLetters = make([]rune, len(letters))
	for i := range t.RevealedLetters {
		t.RevealedLetters[i] = '_'
		if letters[i] == ' ' {
			t.RevealedLetters[i] = ' '
		}
	}
	// prepare indices for reveal (skip spaces)
	t.unrevealedIndices = make([]int, 0, len(letters))
	for i, r := range letters {
		if r != ' ' {
			t.unrevealedIndices = append(t.unrevealedIndices, i)
		}
	}
	// shuffle reveal order
	rand.Shuffle(len(t.unrevealedIndices), func(i, j int) {
		t.unrevealedIndices[i], t.unrevealedIndices[j] = t.unrevealedIndices[j], t.unrevealedIndices[i]
	})
	t.revealedCount = 0
	// reset counter
	// set drawer and start timer
	t.CurrentDrawerID = playerID
	g.Mu.Unlock()
	g.TimerManager.StartTurnTimer(playerID)
	log.Printf("Current revealed letters on turn start: %s", string(t.RevealedLetters))
}

func (t *Turn) BroadcastRevealedLetter(g *Game, timeRemaining int) {
	g.Mu.Lock()
	if g.CurrentTurn != t || t.WordToGuess == nil || g.Options.TurnTimeLimit <= 0 {
		g.Mu.Unlock()
		return
	}
	letters := []rune(t.WordToGuess.Word)
	totalLetters := len(t.unrevealedIndices)
	if totalLetters <= 3 {
		g.Mu.Unlock()
		return
	}
	elapsed := max(0, g.Options.TurnTimeLimit-timeRemaining)
	maxReveal := totalLetters * 7 / 10
	allowed := min(elapsed*maxReveal/g.Options.TurnTimeLimit, maxReveal)
	previous := t.revealedCount
	for t.revealedCount < allowed {
		idx := t.unrevealedIndices[t.revealedCount]
		t.RevealedLetters[idx] = letters[idx]
		t.revealedCount++
	}
	revealed := append([]rune(nil), t.RevealedLetters...)
	changed := t.revealedCount > previous
	drawerID := t.CurrentDrawerID
	g.Mu.Unlock()
	if changed {
		if msg, err := utils.CreateMessage("revealedLetters", map[string]any{"letters": revealed}); err == nil {
			g.Messenger.SendToOthers(drawerID, msg)
		}
	}
}

func (t *Turn) End(g *Game) {
	log.Println("Turn ended")
	g.CancelTimer("turnTimer")
	g.ClearDrawingPlayers()
	g.Round.MarkPlayerAsDrawn(t.CurrentDrawerID)
	t.Phase = PhaseWordSelection
	t.RevealedLetters = nil
	t.revealedCount = 0
	g.Mu.Lock()
	roundComplete := len(g.Round.PlayersDrawn) == len(g.PlayerOrder)
	g.Mu.Unlock()
	g.setWord(nil)
	g.BroadcastGameState()
	if roundComplete {
		log.Println("Round is over signalling round ended ")
		g.FlowSignal <- RoundEnded
	} else {
		g.Round.NextDrawer(g)
		g.FlowSignal <- TurnStarted
	}
}

func getCurrentDrawer(g *Game) *shared.Player {
	return g.Players[g.PlayerOrder[g.Round.CurrentDrawerIdx]]
}

func (t *Turn) allGuessedCorrectly() bool {
	for _, guessedCorrectly := range t.PlayersGuessedCorrectly {
		if !guessedCorrectly {
			return false
		}
	}
	return true
}
