package game

import (
	"log"
	"math"

	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

func (g *Game) PlayerGuess(playerID string, guess *shared.Word) {
	// Check if the player is the current drawer.
	if g.PlayerOrder[g.Round.CurrentDrawerIdx] == playerID {
		return
	}

	if g.timers["turnTimer"] == nil {
		log.Println("No turn timer found, returning early")
		return
	}

	// // Check if the guess is correct.
	// if guess == g.WordToGuess {
	// 	// Correct guess; increment the score.
	// 	g.Players[playerID].Score++
	// 	// Start a new round.
	// 	g.NextRound()
	// }
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

	// Fill the DP table
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
