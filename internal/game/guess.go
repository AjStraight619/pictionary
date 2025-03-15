package game

import (
	"fmt"
	"log"
	"math"

	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

func (g *Game) handlePlayerGuess(playerID string, guess string) {
	// Check if the player is the current drawer.
	if g.PlayerOrder[g.Round.CurrentDrawerIdx] == playerID {
		log.Println("Player is the current drawer, returning early")
		return
	}

	if g.timers["turnTimer"] == nil {
		log.Println("No turn timer found, returning early")
		return
	}

	if g.CurrentTurn.WordToGuess == nil {
		log.Println("No word to guess, returning early")
		return
	}

	if g.CurrentTurn.PlayersGuessedCorrectly[playerID] {
		log.Println("Player already guessed correctly, returning early")
		return
	}

	if guess == g.CurrentTurn.WordToGuess.Word {
		g.CurrentTurn.PlayersGuessedCorrectly[playerID] = true
		g.Players[playerID].Score += CalculateScore(g)
		SendGuessMessage(g, playerID, fmt.Sprintf("%s guessed correctly!", g.Players[playerID].Username)) // Send correct message to not give away the answer
		if g.CurrentTurn.allGuessedCorrectly() {
			log.Println("All players have guessed correctly!")
			g.FlowSignal <- TurnEnded
		}
		g.BroadcastGameState()
		return
	}
	distance := levenshteinDistance(guess, g.CurrentTurn.WordToGuess.Word)
	if distance <= 2 {
		log.Printf("Player %s guessed close! (distance: %d)", playerID, distance)
		SendGuessMessage(g, playerID, fmt.Sprintf("%s guess is close!", g.Players[playerID].Username)) // Send close message to not give away the answer

	} else {
		log.Printf("Player %s guessed: %s (distance: %d)", playerID, guess, distance)
		SendGuessMessage(g, playerID, guess) // Simply return the guess
	}
}

func CalculateScore(g *Game) int {

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
	payload := map[string]interface{}{
		"guess":    result,
		"username": g.Players[playerID].Username,
	}
	if b, err := utils.CreateMessage("guess", payload); err == nil {
		g.Messenger.BroadcastMessage(b)
	} else {
		log.Println("error marshalling guessFeedback message:", err)
	}
}
