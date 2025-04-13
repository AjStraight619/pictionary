package handlers

import (
	"log"
	"net/http"

	"github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/session"
	"github.com/labstack/echo/v4"
)

// GetPlayerIDFromSession tries to get playerID and username from session
// or falls back to query parameters
func GetPlayerIDFromSession(c echo.Context, gameID string) (playerID, username string, hasAccess bool) {
	sessionData := session.GetSessionData(c)
	if sessionData != nil {
		// Session exists, get player info from it
		playerID = sessionData.PlayerID
		username = sessionData.Username

		// Check if player has access to this game
		for _, id := range sessionData.GameIDs {
			if id == gameID {
				hasAccess = true
				break
			}
		}

		if !hasAccess {
			log.Printf("Player %s tried to access game %s without permission", playerID, gameID)
		}
	}

	// Fallback to query params if session not found
	if playerID == "" {
		playerID = c.QueryParam("playerID")
		username = c.QueryParam("username")
	}

	return playerID, username, hasAccess
}

// HandleRemovedPlayer checks if a player was removed from a game and updates their session
// Returns true if the player was removed
func HandleRemovedPlayer(c echo.Context, g *game.Game, playerID, gameID string) (bool, error) {
	// Check if this player was removed
	g.Mu.RLock()
	_, isRemoved := g.RemovedPlayers[playerID]
	g.Mu.RUnlock()

	if !isRemoved {
		return false, nil
	}

	// Player was removed - invalidate their session for this game
	sessionData := session.GetSessionData(c)
	if sessionData != nil && sessionData.PlayerID == playerID {
		sessionMgr := session.GetSessionManager(c)
		if sessionMgr != nil {
			sessionID := session.GetSessionID(c)

			// Remove this game from their session
			newGameIDs := make([]string, 0)
			for _, id := range sessionData.GameIDs {
				if id != gameID {
					newGameIDs = append(newGameIDs, id)
				}
			}
			sessionData.GameIDs = newGameIDs
			sessionMgr.Update(sessionID, *sessionData)

			log.Printf("Removed game %s from session for player %s", gameID, playerID)
		}
	}

	return true, c.JSON(http.StatusForbidden, map[string]string{
		"error": "You were removed from this game by the host",
	})
}

// UpdateSessionWithNewPlayer updates an existing session or creates a new one
func UpdateSessionWithNewPlayer(c echo.Context, playerID, username, gameID string) {
	sessionMgr := session.GetSessionManager(c)
	if sessionMgr == nil {
		return
	}

	sessionData := session.GetSessionData(c)
	var sessionID string

	// If we have an existing session, update it
	if sessionData != nil {
		sessionID = session.GetSessionID(c)
		sessionData.PlayerID = playerID
		sessionData.Username = username

		// Add this game to the existing games if not already present
		gameExists := false
		for _, id := range sessionData.GameIDs {
			if id == gameID {
				gameExists = true
				break
			}
		}

		if !gameExists {
			sessionData.GameIDs = append(sessionData.GameIDs, gameID)
		}

		sessionMgr.Update(sessionID, *sessionData)
	} else {
		// Create a new session
		var err error
		sessionID, err = sessionMgr.Create(playerID, username)
		if err != nil {
			log.Printf("Failed to create session: %v", err)
		} else {
			// Add game to session
			if err := sessionMgr.AddGameToSession(sessionID, gameID); err != nil {
				log.Printf("Failed to add game to session: %v", err)
			}
		}
	}

	// Set session cookie
	if sessionID != "" {
		session.SetSessionCookie(c, sessionID)
	}
}

// HandleReconnection checks if a player can reconnect to a game
// Returns playerID and isReconnecting
func HandleReconnection(c echo.Context, g *game.Game, playerID, username, gameID string) (string, bool) {
	if playerID == "" {
		return playerID, false
	}

	// Try to reconnect
	isReconnecting := g.HandleReconnect(playerID)

	// If reconnecting, update username if needed
	if isReconnecting {
		log.Printf("Player %s reconnecting to game %s", playerID, gameID)

		sessionData := session.GetSessionData(c)
		if sessionData != nil && sessionData.Username != username {
			// Update session data with new username
			sessionData.Username = username
			sessionID := session.GetSessionID(c)
			if sessionMgr := session.GetSessionManager(c); sessionMgr != nil {
				sessionMgr.Update(sessionID, *sessionData)
			}
		}
	}

	return playerID, isReconnecting
}
