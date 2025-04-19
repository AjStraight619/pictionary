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
	letters := []rune(g.CurrentTurn.WordToGuess.Word)
	t.RevealedLetters = make([]rune, len(letters))
	for i := range t.RevealedLetters {
		t.RevealedLetters[i] = '_'
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
	// reset counter
	// set drawer and start timer
	t.CurrentDrawerID = playerID
	g.TimerManager.StartTurnTimer(playerID)
	log.Printf("Current revealed letters on turn start: %s", string(t.RevealedLetters))
}

func (t *Turn) BroadcastRevealedLetter(g *Game, timeRemaining int) {
	letters := []rune(t.WordToGuess.Word)
	totalLetters := len(letters)
	turnLimit := g.Options.TurnTimeLimit

	// don't reveal short words
	if totalLetters <= 3 {
		return
	}

	elapsed := turnLimit - timeRemaining
	maxReveal := int(float64(totalLetters) * 0.7)
	if maxReveal <= 0 {
		return
	}

	// determine how many letters should be revealed by now (linear)
	allowed := elapsed * maxReveal / turnLimit
	if allowed > maxReveal {
		allowed = maxReveal
	}

	// reveal any new letters up to allowed
	for t.revealedCount < allowed && t.revealedCount < len(t.unrevealedIndices) {
		idx := t.unrevealedIndices[t.revealedCount]
		t.RevealedLetters[idx] = letters[idx]
		t.revealedCount++
	}

	// only broadcast when new letters were revealed
	if t.revealedCount > 0 {
		if msg, err := utils.CreateMessage("revealedLetters", t.RevealedLetters); err == nil {
			g.Messenger.SendToOthers(t.CurrentDrawerID, msg)
		} else {
			log.Println("error marshalling revealedLetters message:", err)
		}
	}
}

func (t *Turn) End(g *Game) {
	log.Println("Turn ended")
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

func (t *Turn) allGuessedCorrectly() bool {
	for _, guessedCorrectly := range t.PlayersGuessedCorrectly {
		if !guessedCorrectly {
			return false
		}
	}
	return true
}
