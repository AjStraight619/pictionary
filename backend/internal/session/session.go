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
	// Parse the Redis URL to create a client
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Redis URL: %w", err)
	}

	client := redis.NewClient(opt)

	// Test the connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	log.Println("Connected to Redis successfully")
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
		return "", err
	}

	return sessionID, nil
}

// Get retrieves a session by ID
func (m *Manager) Get(sessionID string) (*SessionData, error) {
	if m.client == nil {
		return nil, ErrRedisNotConnected
	}

	jsonData, err := m.client.Get(m.ctx, sessionKey(sessionID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}

	var data SessionData
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return nil, err
	}

	// Update last seen timestamp
	data.LastSeen = time.Now()
	m.Update(sessionID, data)

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

	return m.client.Set(m.ctx, sessionKey(sessionID), jsonData, SessionExpiration).Err()
}

// Delete removes a session
func (m *Manager) Delete(sessionID string) error {
	if m.client == nil {
		return ErrRedisNotConnected
	}

	return m.client.Del(m.ctx, sessionKey(sessionID)).Err()
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
	return m.Update(sessionID, *data)
}

// GetPlayerSessions finds all sessions for a player ID
func (m *Manager) GetPlayerSessions(playerID string) ([]string, error) {
	if m.client == nil {
		return nil, ErrRedisNotConnected
	}

	var cursor uint64
	var sessionIDs []string

	for {
		var keys []string
		var err error
		keys, cursor, err = m.client.Scan(m.ctx, cursor, "session:*", 100).Result()
		if err != nil {
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
				sessionIDs = append(sessionIDs, key[8:])
			}
		}

		if cursor == 0 {
			break
		}
	}

	return sessionIDs, nil
}

func sessionKey(sessionID string) string {
	return "session:" + sessionID
}
