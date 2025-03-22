package server

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/ws"
)

type GameInstance struct {
	Game       *game.Game
	Hub        *ws.Hub
	CancelFunc context.CancelFunc // Game-specific cancel function
}

type GameServer struct {
	ctx        context.Context
	cancelFunc context.CancelFunc
	games      map[string]*GameInstance // Change from *game.Games to map of GameInstance
	mu         sync.RWMutex             // Add mutex for thread safety
}

func NewGameServer() *GameServer {
	ctx, cancel := context.WithCancel(context.Background())
	return &GameServer{
		ctx:        ctx,
		cancelFunc: cancel,
		games:      make(map[string]*GameInstance),
	}
}

// CreateGame now creates a game-specific context
func (s *GameServer) CreateGame(id string, options shared.GameOptions) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	gameCtx, gameCancel := context.WithCancel(s.ctx)

	// Create hub and game with game-specific context
	hub := ws.NewHub(gameCtx)
	game := game.NewGame(gameCtx, id, options, hub, s)
	game.InitGameEvents()

	s.games[id] = &GameInstance{
		Game:       game,
		Hub:        hub,
		CancelFunc: gameCancel,
	}

	go hub.Run()
	go game.Run()

	return nil
}

// StopGame stops a specific game
func (s *GameServer) StopGame(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	instance, exists := s.games[id]
	if !exists {
		return fmt.Errorf("game not found: %s", id)
	}

	// Cancel this specific game's context
	instance.CancelFunc()

	// Remove from games map
	delete(s.games, id)

	return nil
}

// Shutdown stops all games
func (s *GameServer) Shutdown(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Cancel server context (affects all games)
	s.cancelFunc()

	// Optional: wait for cleanup or timeout
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(5 * time.Second):
		return nil
	}
}

// GetGame returns a specific game
func (s *GameServer) GetGame(id string) (*game.Game, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	instance, exists := s.games[id]
	if !exists {
		return nil, false
	}
	return instance.Game, true
}

// GetHub returns a specific hub
func (s *GameServer) GetHub(id string) (*ws.Hub, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	instance, exists := s.games[id]
	if !exists {
		return nil, false
	}
	return instance.Hub, true
}

func (s *GameServer) OnGameEnded(gameID string) {
	s.StopGame(gameID)
}
