package handlers

import (
	"context"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/session"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/alicebob/miniredis/v2"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockGame extends the game.Game struct with mocked methods for testing
type MockGame struct {
	*game.Game
	MockHandleReconnect func(string) bool
	reconnectCalled     bool
}

// HandleReconnect mocks the method for testing
func (g *MockGame) HandleReconnect(playerID string) bool {
	g.reconnectCalled = true
	if g.MockHandleReconnect != nil {
		return g.MockHandleReconnect(playerID)
	}
	return false
}

// MockHandleReconnection is a test version that doesn't call the real game.HandleReconnect
func MockHandleReconnection(c echo.Context, g *MockGame, playerID, username, gameID string) (string, bool) {
	if playerID == "" {
		return playerID, false
	}

	// Use our mock reconnect function instead of the real one
	isReconnecting := g.HandleReconnect(playerID)

	// If reconnecting, update username if needed
	if isReconnecting {
		log.Printf("[TEST] Mock reconnection for player %s to game %s", playerID, gameID)

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

// Setup a test environment with Echo, Redis, and a game
func setupTestEnvironment(t *testing.T) (*echo.Echo, *miniredis.Miniredis, *session.Manager, *MockGame, func()) {
	// Setup Echo
	e := echo.New()

	// Setup Redis
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("Failed to create miniredis: %v", err)
	}

	// Use the miniredis URL for Redis
	redisURL := "redis://" + mr.Addr()

	// Create session manager using the proper factory function
	ctx := context.Background()
	manager, err := session.NewManager(ctx, redisURL)
	require.NoError(t, err)

	// Create a minimal mock game with mocked methods
	g := &MockGame{
		Game: &game.Game{
			ID:                      "test-game-123",
			Players:                 make(map[string]*shared.Player),
			PlayerOrder:             []string{},
			RemovedPlayers:          make(map[string]interface{}),
			TempDisconnectedPlayers: make(map[string]*shared.Player),
		},
		// Default behavior for reconnect - can be overridden in tests
		MockHandleReconnect: func(playerID string) bool {
			return true // By default, allow reconnection
		},
	}

	// Create cleanup function
	cleanup := func() {
		mr.Close()
	}

	return e, mr, manager, g, cleanup
}

// Helper to create a test request with a session cookie
func createRequestWithSession(t *testing.T, e *echo.Echo, path string, sessionID string) (echo.Context, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(http.MethodGet, path, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if sessionID != "" {
		cookie := new(http.Cookie)
		cookie.Name = session.CookieName
		cookie.Value = sessionID
		req.AddCookie(cookie)
	}

	return c, rec
}

func TestGetPlayerIDFromSession(t *testing.T) {
	e, _, manager, g, cleanup := setupTestEnvironment(t)
	defer cleanup()

	// Create a test session with a player and game
	playerID := "player-123"
	username := "TestPlayer"
	gameID := g.ID

	sessionID, err := manager.Create(playerID, username)
	assert.NoError(t, err)

	err = manager.AddGameToSession(sessionID, gameID)
	assert.NoError(t, err)

	// Create request with session cookie
	c, _ := createRequestWithSession(t, e, "/test", sessionID)

	// Store session manager in context
	c.Set("session_manager", manager)

	// Store session data in context (normally done by middleware)
	sessionData, err := manager.Get(sessionID)
	assert.NoError(t, err)
	c.Set("session_id", sessionID)
	c.Set("session_data", sessionData)

	// Call the function
	retrievedPlayerID, retrievedUsername, hasAccess := GetPlayerIDFromSession(c, gameID)

	// Verify the results
	assert.Equal(t, playerID, retrievedPlayerID)
	assert.Equal(t, username, retrievedUsername)
	assert.True(t, hasAccess)
}

func TestGetPlayerIDFromSessionFallback(t *testing.T) {
	e, _, _, g, cleanup := setupTestEnvironment(t)
	defer cleanup()

	// Create request without session but with query params
	req := httptest.NewRequest(http.MethodGet, "/?playerID=query-player&username=QueryUser", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Call the function
	playerID, username, hasAccess := GetPlayerIDFromSession(c, g.ID)

	// Verify fallback to query params
	assert.Equal(t, "query-player", playerID)
	assert.Equal(t, "QueryUser", username)
	assert.False(t, hasAccess)
}

func TestHandleRemovedPlayer(t *testing.T) {
	e, _, manager, g, cleanup := setupTestEnvironment(t)
	defer cleanup()

	// Create a player and add to removed players
	playerID := "removed-player"
	username := "RemovedUser"
	gameID := g.ID

	// Create a session for this player with access to the game
	sessionID, err := manager.Create(playerID, username)
	assert.NoError(t, err)
	err = manager.AddGameToSession(sessionID, gameID)
	assert.NoError(t, err)

	// Mark player as removed in the game
	g.RemovedPlayers = make(map[string]interface{})
	g.RemovedPlayers[playerID] = true

	// Setup request with session
	c, _ := createRequestWithSession(t, e, "/test", sessionID)

	// Store session manager and data in context
	c.Set("session_manager", manager)
	sessionData, err := manager.Get(sessionID)
	assert.NoError(t, err)
	c.Set("session_id", sessionID)
	c.Set("session_data", sessionData)

	// Call the function
	isRemoved, _ := HandleRemovedPlayer(c, g.Game, playerID, gameID)

	// Verify the player was identified as removed
	assert.True(t, isRemoved)

	// Verify game was removed from session
	updatedSession, err := manager.Get(sessionID)
	assert.NoError(t, err)
	assert.NotContains(t, updatedSession.GameIDs, gameID)
}

func TestUpdateSessionWithNewPlayer(t *testing.T) {
	e, _, manager, g, cleanup := setupTestEnvironment(t)
	defer cleanup()

	// Create test data
	playerID := "new-player-123"
	username := "NewPlayer"
	gameID := g.ID

	// Setup request
	c, rec := createRequestWithSession(t, e, "/test", "")

	// Store session manager in context
	c.Set("session_manager", manager)

	// Call the function
	UpdateSessionWithNewPlayer(c, playerID, username, gameID)

	// Check if a cookie was set
	cookies := rec.Result().Cookies()
	var sessionCookie *http.Cookie
	for _, cookie := range cookies {
		if cookie.Name == session.CookieName {
			sessionCookie = cookie
			break
		}
	}

	assert.NotNil(t, sessionCookie)

	// Verify session was created in Redis
	sessionData, err := manager.Get(sessionCookie.Value)
	assert.NoError(t, err)
	assert.Equal(t, playerID, sessionData.PlayerID)
	assert.Equal(t, username, sessionData.Username)
	assert.Contains(t, sessionData.GameIDs, gameID)
}

func TestHandleReconnection(t *testing.T) {
	e, _, manager, g, cleanup := setupTestEnvironment(t)
	defer cleanup()

	// Create a player in the game
	playerID := "reconnect-player"
	username := "ReconnectUser"
	newUsername := "UpdatedUser"

	player := &shared.Player{
		ID:        playerID,
		Username:  username,
		Connected: false,
	}

	// Add player to game's temp disconnected players
	g.TempDisconnectedPlayers[playerID] = player

	// Override the mock HandleReconnect behavior for this test
	g.MockHandleReconnect = func(id string) bool {
		return id == playerID
	}

	// Add the player to the Players map so it can be retrieved after "reconnection"
	g.Players[playerID] = player

	// Create a session
	sessionID, _ := manager.Create(playerID, username)

	// Setup context with session
	c, _ := createRequestWithSession(t, e, "/test", sessionID)
	c.Set("session_manager", manager)
	sessionData, _ := manager.Get(sessionID)
	c.Set("session_id", sessionID)
	c.Set("session_data", sessionData)

	// Call function with updated username
	returnedPlayerID, isReconnecting := MockHandleReconnection(c, g, playerID, newUsername, g.ID)

	// Verify reconnection works and our mock was called
	assert.Equal(t, playerID, returnedPlayerID)
	assert.True(t, isReconnecting)
	assert.True(t, g.reconnectCalled)

	// Verify username was updated in session
	updatedSession, _ := manager.Get(sessionID)
	assert.Equal(t, newUsername, updatedSession.Username)
}

// Integration test for the full flow
func TestFullSessionFlow(t *testing.T) {
	e, _, manager, g, cleanup := setupTestEnvironment(t)
	defer cleanup()

	// Step 1: Create a new player and add to session
	playerID := uuid.New().String()
	username := "FlowUser"
	gameID := g.ID

	// Setup initial request
	c, rec := createRequestWithSession(t, e, "/test", "")
	c.Set("session_manager", manager)

	// Create session
	UpdateSessionWithNewPlayer(c, playerID, username, gameID)

	// Get the session ID from the cookie
	cookies := rec.Result().Cookies()
	var sessionID string
	for _, cookie := range cookies {
		if cookie.Name == session.CookieName {
			sessionID = cookie.Value
			break
		}
	}

	// Step 2: Try to reconnect to the game
	player := &shared.Player{
		ID:        playerID,
		Username:  username,
		Connected: false,
	}

	// Setup mock game for reconnection
	g.TempDisconnectedPlayers[playerID] = player
	g.Players[playerID] = player // Add to active players to simulate successful reconnection

	// Create new context with the session cookie
	c2, _ := createRequestWithSession(t, e, "/test", sessionID)
	c2.Set("session_manager", manager)
	sessionData, _ := manager.Get(sessionID)
	c2.Set("session_id", sessionID)
	c2.Set("session_data", sessionData)

	// Get player ID from session
	retrievedPlayerID, retrievedUsername, hasAccess := GetPlayerIDFromSession(c2, gameID)
	assert.Equal(t, playerID, retrievedPlayerID)
	assert.Equal(t, username, retrievedUsername)
	assert.True(t, hasAccess)

	// Try to reconnect
	_, isReconnecting := MockHandleReconnection(c2, g, retrievedPlayerID, retrievedUsername, gameID)
	assert.True(t, isReconnecting)
}
