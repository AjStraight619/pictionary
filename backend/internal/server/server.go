package server

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/Ajstraight619/pictionary-server/internal/game"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/ws"
)

type GameInstance struct {
	Game       *game.Game
	Hub        *ws.Hub
	CancelFunc context.CancelFunc
}

type GameServer struct {
	ctx        context.Context
	cancelFunc context.CancelFunc
	games      map[string]*GameInstance
	mu         sync.RWMutex
}

func NewGameServer() *GameServer {
	ctx, cancel := context.WithCancel(context.Background())
	server := &GameServer{
		ctx:        ctx,
		cancelFunc: cancel,
		games:      make(map[string]*GameInstance),
	}

	server.StartInactiveGamesCleaner()

	return server
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

// Add this new method to GameServer
func (s *GameServer) StartInactiveGamesCleaner() {
	log.Println("Starting inactive games cleaner...")

	go func() {
		cleanupTicker := time.NewTicker(10 * time.Minute)
		defer cleanupTicker.Stop()

		for {
			select {
			case <-cleanupTicker.C:
				s.cleanupInactiveGames()
			case <-s.ctx.Done():
				log.Println("Stopping inactive games cleaner...")
				return
			}
		}
	}()
}

// cleanupInactiveGames cleans up games that are inactive or have no players
func (s *GameServer) cleanupInactiveGames() {
	log.Println("Running inactive games cleanup check...")

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	gameIDsToRemove := []string{}

	// Find games to clean up
	for id, instance := range s.games {
		game := instance.Game

		// Get game stats using the proper API
		lastActivity, playerCount, status := game.GetLastActivityInfo()
		inactiveTime := now.Sub(lastActivity)

		if (playerCount == 0 && inactiveTime > 30*time.Minute) ||
			(inactiveTime > 2*time.Hour) ||
			(status == 2 /* Finished */ && inactiveTime > 15*time.Minute) {
			log.Printf("Marking game %s for cleanup (players: %d, inactive: %v, status: %v)",
				id, playerCount, inactiveTime, status)
			gameIDsToRemove = append(gameIDsToRemove, id)
		}
	}

	// Clean up the marked games
	for _, id := range gameIDsToRemove {
		log.Printf("Cleaning up inactive game: %s", id)
		instance := s.games[id]
		instance.CancelFunc() // Cancel the game context
		delete(s.games, id)   // Remove from games map
	}

	log.Printf("Inactive games cleanup complete. Removed %d games. Current games: %d",
		len(gameIDsToRemove), len(s.games))
}
