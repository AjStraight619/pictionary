package session

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"

	"slices"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

const (
	// SessionExpiration is the time until a session expires
	SessionExpiration = 24 * time.Hour

	// CookieName is the name of the cookie that stores the session ID
	CookieName = "pictionary_session"
)

var (
	// ErrSessionNotFound is returned when a session is not found
	ErrSessionNotFound = errors.New("session not found")

	// ErrRedisNotConnected is returned when Redis is not connected
	ErrRedisNotConnected = errors.New("redis not connected")
)

// SessionData holds the data stored in a session
type SessionData struct {
	PlayerID  string    `json:"player_id"`
	Username  string    `json:"username"`
	GameIDs   []string  `json:"game_ids,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	LastSeen  time.Time `json:"last_seen"`
}

// Manager handles sessions using Redis
type Manager struct {
	client *redis.Client
	ctx    context.Context
}

// NewManager creates a new session manager
func NewManager(ctx context.Context, redisURL string) (*Manager, error) {
	log.Printf("[REDIS] Connecting to Redis at URL: %s", redisURL)

	// Parse the Redis URL to create a client
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("[REDIS] Invalid Redis URL: %v", err)
		return nil, fmt.Errorf("invalid Redis URL: %w", err)
	}

	client := redis.NewClient(opt)

	// Test the connection
	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[REDIS] Connection failed: %v", err)
		return nil, err
	}

	log.Printf("[REDIS] Connected to Redis successfully")
	return &Manager{
		client: client,
		ctx:    ctx,
	}, nil
}

// Create creates a new session
func (m *Manager) Create(playerID, username string) (string, error) {
	if m.client == nil {
		return "", ErrRedisNotConnected
	}

	sessionID := uuid.New().String()
	data := SessionData{
		PlayerID:  playerID,
		Username:  username,
		GameIDs:   []string{},
		CreatedAt: time.Now(),
		LastSeen:  time.Now(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return "", err
	}

	err = m.client.Set(m.ctx, sessionKey(sessionID), jsonData, SessionExpiration).Err()
	if err != nil {
		log.Printf("[REDIS] Failed to create session: %v", err)
		return "", err
	}

	log.Printf("[REDIS] Created new session %s for player %s (username: %s)",
		sessionID, playerID, username)
	return sessionID, nil
}

// Get retrieves a session by ID
func (m *Manager) Get(sessionID string) (*SessionData, error) {
	if m.client == nil {
		log.Printf("[REDIS] Cannot get session: Redis not connected")
		return nil, ErrRedisNotConnected
	}

	jsonData, err := m.client.Get(m.ctx, sessionKey(sessionID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			log.Printf("[REDIS] Session not found in Redis: %s", sessionID)
			return nil, ErrSessionNotFound
		}
		log.Printf("[REDIS] Error retrieving session from Redis: %v", err)
		return nil, err
	}

	var data SessionData
	if err := json.Unmarshal(jsonData, &data); err != nil {
		log.Printf("[REDIS] Error unmarshal session data: %v", err)
		return nil, err
	}

	// Update last seen timestamp
	data.LastSeen = time.Now()
	m.Update(sessionID, data)

	log.Printf("[REDIS] Retrieved session %s for player %s (username: %s)",
		sessionID, data.PlayerID, data.Username)
	return &data, nil
}

// Update updates an existing session
func (m *Manager) Update(sessionID string, data SessionData) error {
	if m.client == nil {
		return ErrRedisNotConnected
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	err = m.client.Set(m.ctx, sessionKey(sessionID), jsonData, SessionExpiration).Err()
	if err != nil {
		log.Printf("[REDIS] Failed to update session: %v", err)
		return err
	}

	log.Printf("[REDIS] Updated session %s for player %s (username: %s, games: %v)",
		sessionID, data.PlayerID, data.Username, data.GameIDs)
	return nil
}

// Delete removes a session
func (m *Manager) Delete(sessionID string) error {
	if m.client == nil {
		return ErrRedisNotConnected
	}

	err := m.client.Del(m.ctx, sessionKey(sessionID)).Err()
	if err != nil {
		log.Printf("[REDIS] Failed to delete session: %v", err)
		return err
	}

	log.Printf("[REDIS] Deleted session %s", sessionID)
	return nil
}

// AddGameToSession adds a game ID to the player's session
func (m *Manager) AddGameToSession(sessionID, gameID string) error {
	data, err := m.Get(sessionID)
	if err != nil {
		return err
	}

	// Check if game already exists in the session
	if slices.Contains(data.GameIDs, gameID) {
		return nil // Game already in session
	}

	// Add game ID to the session
	data.GameIDs = append(data.GameIDs, gameID)
	log.Printf("[REDIS] Adding game %s to session %s for player %s",
		gameID, sessionID, data.PlayerID)
	return m.Update(sessionID, *data)
}

// GetPlayerSessions finds all sessions for a player ID
func (m *Manager) GetPlayerSessions(playerID string) ([]string, error) {
	if m.client == nil {
		return nil, ErrRedisNotConnected
	}

	var cursor uint64
	var sessionIDs []string

	log.Printf("[REDIS] Searching for sessions for player %s", playerID)

	for {
		var keys []string
		var err error
		keys, cursor, err = m.client.Scan(m.ctx, cursor, "session:*", 100).Result()
		if err != nil {
			log.Printf("[REDIS] Error scanning for sessions: %v", err)
			return nil, err
		}

		for _, key := range keys {
			jsonData, err := m.client.Get(m.ctx, key).Bytes()
			if err != nil {
				continue
			}

			var data SessionData
			if err := json.Unmarshal(jsonData, &data); err != nil {
				continue
			}

			if data.PlayerID == playerID {
				sessionID := key[8:] // Remove "session:" prefix
				sessionIDs = append(sessionIDs, sessionID)
				log.Printf("[REDIS] Found session %s for player %s", sessionID, playerID)
			}
		}

		if cursor == 0 {
			break
		}
	}

	log.Printf("[REDIS] Found %d sessions for player %s", len(sessionIDs), playerID)
	return sessionIDs, nil
}

func sessionKey(sessionID string) string {
	return "session:" + sessionID
}
