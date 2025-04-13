package session

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/assert"
)

func setupTestRedis(t *testing.T) (*miniredis.Miniredis, *Manager) {
	// Create a mini Redis server for testing
	mr, err := miniredis.Run()
	if err != nil {
		t.Fatalf("Failed to create miniredis: %v", err)
	}

	// Use the miniredis server URL for our manager
	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	// Create a session manager with the test Redis
	manager := &Manager{
		client: client,
		ctx:    context.Background(),
	}

	return mr, manager
}

func TestSessionCreation(t *testing.T) {
	mr, manager := setupTestRedis(t)
	defer mr.Close()

	// Test creating a session
	playerID := "test-player-123"
	username := "TestUser"

	sessionID, err := manager.Create(playerID, username)
	assert.NoError(t, err)
	assert.NotEmpty(t, sessionID)

	// Verify the session was stored in Redis
	val, err := mr.Get(sessionKey(sessionID))
	assert.NoError(t, err)
	assert.Contains(t, val, playerID)
	assert.Contains(t, val, username)
}

func TestSessionRetrieval(t *testing.T) {
	mr, manager := setupTestRedis(t)
	defer mr.Close()

	// Create a session
	playerID := "player-456"
	username := "RetrievalUser"

	sessionID, err := manager.Create(playerID, username)
	assert.NoError(t, err)

	// Get the session back
	session, err := manager.Get(sessionID)
	assert.NoError(t, err)
	assert.NotNil(t, session)
	assert.Equal(t, playerID, session.PlayerID)
	assert.Equal(t, username, session.Username)
}

func TestSessionUpdate(t *testing.T) {
	mr, manager := setupTestRedis(t)
	defer mr.Close()

	// Create a session
	playerID := "player-789"
	username := "UpdateUser"

	sessionID, err := manager.Create(playerID, username)
	assert.NoError(t, err)

	// Get the session
	session, err := manager.Get(sessionID)
	assert.NoError(t, err)

	// Update the session
	newUsername := "UpdatedUser"
	session.Username = newUsername
	session.GameIDs = append(session.GameIDs, "game-123")

	err = manager.Update(sessionID, *session)
	assert.NoError(t, err)

	// Get the updated session
	updatedSession, err := manager.Get(sessionID)
	assert.NoError(t, err)
	assert.Equal(t, newUsername, updatedSession.Username)
	assert.Contains(t, updatedSession.GameIDs, "game-123")
}

func TestAddGameToSession(t *testing.T) {
	mr, manager := setupTestRedis(t)
	defer mr.Close()

	// Create a session
	playerID := "player-001"
	username := "GameUser"

	sessionID, err := manager.Create(playerID, username)
	assert.NoError(t, err)

	// Add a game to the session
	gameID := "game-456"
	err = manager.AddGameToSession(sessionID, gameID)
	assert.NoError(t, err)

	// Verify the game was added
	session, err := manager.Get(sessionID)
	assert.NoError(t, err)
	assert.Contains(t, session.GameIDs, gameID)

	// Add the same game again (should be idempotent)
	err = manager.AddGameToSession(sessionID, gameID)
	assert.NoError(t, err)

	// Verify there's still only one instance of the game
	session, err = manager.Get(sessionID)
	assert.NoError(t, err)
	count := 0
	for _, id := range session.GameIDs {
		if id == gameID {
			count++
		}
	}
	assert.Equal(t, 1, count)
}

func TestSessionExpiration(t *testing.T) {
	mr, manager := setupTestRedis(t)
	defer mr.Close()

	// Create a session
	sessionID, err := manager.Create("expiry-player", "ExpiryTest")
	assert.NoError(t, err)

	// Fast forward time in the mock Redis
	mr.FastForward(SessionExpiration + time.Second)

	// Try to get the expired session
	_, err = manager.Get(sessionID)
	assert.Error(t, err)
	assert.Equal(t, ErrSessionNotFound, err)
}

func TestGetPlayerSessions(t *testing.T) {
	mr, manager := setupTestRedis(t)
	defer mr.Close()

	playerID := "multi-session-player"

	// Create multiple sessions for the same player
	session1, err := manager.Create(playerID, "User1")
	assert.NoError(t, err)

	session2, err := manager.Create(playerID, "User2")
	assert.NoError(t, err)

	// Create a session for a different player
	_, err = manager.Create("other-player", "OtherUser")
	assert.NoError(t, err)

	// Get all sessions for our player
	sessions, err := manager.GetPlayerSessions(playerID)
	assert.NoError(t, err)
	assert.Contains(t, sessions, session1)
	assert.Contains(t, sessions, session2)
	assert.Equal(t, 2, len(sessions))
}

// Integration test with real Redis if available
func TestRealRedisConnection(t *testing.T) {
	// Skip if we don't have a Redis URL in the environment
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		t.Skip("Skipping integration test: No REDIS_URL in environment")
	}

	// Try to connect to real Redis
	ctx := context.Background()
	manager, err := NewManager(ctx, redisURL)
	if err != nil {
		t.Fatalf("Failed to connect to Redis at %s: %v", redisURL, err)
	}

	// Create a test session
	sessionID, err := manager.Create("integration-test", "IntegrationUser")
	assert.NoError(t, err)
	assert.NotEmpty(t, sessionID)

	// Clean up - delete the test session
	err = manager.Delete(sessionID)
	assert.NoError(t, err)
}
