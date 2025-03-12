package game

import (
	"log"
	"math"
	"math/rand"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type Turn struct {
	WordToGuess             *shared.Word    `json:"wordToGuess,omitempty"`
	RevealedLetters         []rune          `json:"revealedLetters"`
	PlayersGuessedCorrectly map[string]bool `json:"playersGuessedCorrectly"`
}

func NewTurn() *Turn {
	return &Turn{
		PlayersGuessedCorrectly: make(map[string]bool),
		RevealedLetters:         make([]rune, 0),
		WordToGuess:             nil,
	}
}

func (t *Turn) Start(g *Game, playerID string) {
	log.Println("Turn started")
	revealedLetters := make([]rune, len(g.CurrentTurn.WordToGuess.Word))
	for i := range revealedLetters {
		revealedLetters[i] = '_'
	}
	t.RevealedLetters = revealedLetters
	g.TimerManager.StartTurnTimer(playerID)
}

func (t *Turn) BroadcastRevealedLetter(g *Game, timeRemaining int) {
	letters := []rune(t.WordToGuess.Word)
	totalLetters := len(letters)
	turnTimeLimit := g.Options.TurnTimeLimit

	elapsedTime := turnTimeLimit - timeRemaining

	letterInterval := float64(turnTimeLimit) / float64(totalLetters)
	targetCount := int(math.Ceil(float64(elapsedTime) / letterInterval))
	if targetCount < 1 {
		targetCount = 1
	}
	if targetCount > totalLetters {
		targetCount = totalLetters
	}

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
		// Remove the index from the slice.
		unrevealedIndices = append(unrevealedIndices[:randIdx], unrevealedIndices[randIdx+1:]...)
	}

	// Broadcast the updated revealed letters to all players.
	msgType := "revealedLetter"
	payload := map[string]interface{}{
		"revealedLetters": string(t.RevealedLetters),
	}
	if b, err := utils.CreateMessage(msgType, payload); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Println("error marshalling revealedLetter message:", err)
	}
}

func (t *Turn) End(g *Game) {
	log.Println("Turn ended")
	g.Mu.Lock()
	roundComplete := len(g.Round.PlayersDrawn) == len(g.PlayerOrder)
	for id, p := range g.Players {
		p.IsDrawing = false
		log.Printf("Player %s isDrawing set to false", id)
	}
	g.Mu.Unlock()
	g.CurrentTurn = NewTurn()

	g.BroadcastGameState()
	if roundComplete {
		g.FlowSignal <- RoundEnded
	} else {
		// Delegate to Round for next drawer selection.
		g.Round.NextDrawer(g)
		g.FlowSignal <- TurnStarted
	}
}
