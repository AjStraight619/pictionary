package game

import (
	"fmt"
	"log"
	"math"
	"strings"

	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

func (g *Game) handlePlayerGuess(playerID string, guess string) {
	g.Mu.Lock()
	unlocked := false
	defer func() {
		if !unlocked {
			g.Mu.Unlock()
		}
	}()

	if g.CurrentTurn.WordToGuess == nil {
		log.Printf("WORD: At guess, word is nil")
		return
	} else {
		log.Printf("WORD: At guess, word is: %v", g.CurrentTurn.WordToGuess.Word)
	}
	log.Printf("WORD: At guess, guess is: %v", guess)

	// Early checks
	if g.PlayerOrder[g.Round.CurrentDrawerIdx] == playerID {
		return
	}

	if g.timers["turnTimer"] == nil {
		return
	}

	if g.CurrentTurn.WordToGuess == nil {
		return
	}

	if g.CurrentTurn.PlayersGuessedCorrectly[playerID] {
		return
	}

	normalizedGuess := strings.ToLower(strings.TrimSpace(guess))
	normalizedWord := strings.ToLower(strings.TrimSpace(g.CurrentTurn.WordToGuess.Word))

	if normalizedGuess == normalizedWord {
		scoreToAdd := calculateScore(g)

		// Update player's score
		g.CurrentTurn.PlayersGuessedCorrectly[playerID] = true
		g.Players[playerID].Score += scoreToAdd

		// Send messages while still holding lock
		SendGuessMessage(g, playerID, fmt.Sprintf("%s guessed correctly!", g.Players[playerID].Username))

		// Score update
		scoreUpdatePayload := map[string]interface{}{
			"playerID": playerID,
			"score":    g.Players[playerID].Score,
		}
		if b, err := utils.CreateMessage("scoreUpdated", scoreUpdatePayload); err == nil {
			log.Printf("Broadcasting score update for %s: %d points", g.Players[playerID].Username, g.Players[playerID].Score)
			g.Messenger.BroadcastMessage(b)
		}

		// Check if all guessed correctly
		if g.CurrentTurn.allGuessedCorrectly() {
			addBonusScoreForDrawer(g)
			unlocked = true
			g.Mu.Unlock()
			g.FlowSignal <- TurnEnded
		}

		return
	}

	// Handle non-correct guess
	distance := levenshteinDistance(guess, g.CurrentTurn.WordToGuess.Word)
	if distance <= 2 {
		log.Printf("Player %s guessed close! (distance: %d)", playerID, distance)
		SendGuessMessage(g, playerID, fmt.Sprintf("%s guess is close!", g.Players[playerID].Username))
	} else {
		log.Printf("Player %s guessed: %s (distance: %d)", playerID, guess, distance)
		SendGuessMessage(g, playerID, guess)
	}
}

func calculateScore(g *Game) int {

	turnTimeRemaining := g.GetRemainingTime("turnTimer")
	// Ensure that we have a valid timer duration.
	duration := g.timers["turnTimer"].duration
	if duration == 0 {
		return 0
	}
	// Score is proportional to the remaining time.
	score := int(100 * (float64(turnTimeRemaining) / float64(duration)))
	return score
}

func addBonusScoreForDrawer(g *Game) {
	drawer := getCurrentDrawer(g)
	drawer.Score += 100
}

func levenshteinDistance(s1, s2 string) int {
	m, n := len(s1), len(s2)
	dp := make([][]int, m+1)

	// Initialize the DP table
	for i := range dp {
		dp[i] = make([]int, n+1)
	}

	// Base cases
	for i := 0; i <= m; i++ {
		dp[i][0] = i
	}
	for j := 0; j <= n; j++ {
		dp[0][j] = j
	}

	for i := 1; i <= m; i++ {
		for j := 1; j <= n; j++ {
			if s1[i-1] == s2[j-1] {
				dp[i][j] = dp[i-1][j-1]
			} else {
				dp[i][j] = 1 + int(math.Min(math.Min(
					float64(dp[i-1][j]), // Deletion
					float64(dp[i][j-1]), // Insertion
				), float64(dp[i-1][j-1]))) // Substitution
			}
		}
	}

	return dp[m][n]
}

func SendGuessMessage(g *Game, playerID, result string) {
	playerColor := g.getPlayerColor(playerID)
	log.Printf("Sending guess message for player %s with color %s", playerID, playerColor)
	payload := map[string]any{
		"guess":    result,
		"username": g.Players[playerID].Username,
		"color":    playerColor,
	}
	if b, err := utils.CreateMessage("playerGuess", payload); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Println("error marshalling guessFeedback message:", err)
	}
}
