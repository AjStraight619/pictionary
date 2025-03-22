package game

import (
	"log"
	"math"
	"math/rand"
	"slices"
	"time"

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
	log.Println("Turn started")
	revealedLetters := make([]rune, len(g.CurrentTurn.WordToGuess.Word))
	for i := range revealedLetters {
		revealedLetters[i] = '_'
	}
	t.RevealedLetters = revealedLetters
	t.CurrentDrawerID = playerID
	g.TimerManager.StartTurnTimer(playerID)
}

func (t *Turn) BroadcastRevealedLetter(g *Game, timeRemaining int) {
	letters := []rune(t.WordToGuess.Word)
	totalLetters := len(letters)
	turnTimeLimit := g.Options.TurnTimeLimit

	elapsedTime := turnTimeLimit - timeRemaining

	letterInterval := float64(turnTimeLimit) / float64(totalLetters)
	targetCount := min(max(int(math.Ceil(float64(elapsedTime)/letterInterval)), 1), totalLetters)

	currentRevealed := 0
	for _, r := range t.RevealedLetters {
		if r != '_' {
			currentRevealed++
		}
	}

	if currentRevealed >= targetCount {
		return
	}

	lettersToReveal := targetCount - currentRevealed

	unrevealedIndices := make([]int, 0, totalLetters)
	for i, r := range t.RevealedLetters {
		if r == '_' {
			unrevealedIndices = append(unrevealedIndices, i)
		}
	}

	randSource := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < lettersToReveal && len(unrevealedIndices) > 0; i++ {
		randIdx := randSource.Intn(len(unrevealedIndices))
		indexToReveal := unrevealedIndices[randIdx]
		t.RevealedLetters[indexToReveal] = letters[indexToReveal]
		// Remove the index from the slice
		unrevealedIndices = slices.Delete(unrevealedIndices, randIdx, randIdx+1)
	}

	// Broadcast the updated revealed letters to all players.
	if b, err := utils.CreateMessage("revealedLetter", t.RevealedLetters); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Println("error marshalling revealedLetter message:", err)
	}
}

func (t *Turn) End(g *Game) {
	log.Println("Turn ended")
	g.ClearDrawingPlayers()
	g.Round.MarkPlayerAsDrawn(t.CurrentDrawerID)
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
