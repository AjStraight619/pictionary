package game_test

//
// import (
// 	"fmt"
// 	"log"
// 	"sync"
// 	"testing"
// 	"time"
//
// 	e "github.com/Ajstraight619/pictionary-server/internal/events"
// 	"github.com/Ajstraight619/pictionary-server/internal/game"
// 	g "github.com/Ajstraight619/pictionary-server/internal/game"
// 	"github.com/Ajstraight619/pictionary-server/internal/shared"
// 	"github.com/stretchr/testify/assert"
// )
//
// type DummyMessenger struct {
// 	events chan e.GameEvent
// }
//
// func NewDummyMessenger() *DummyMessenger {
// 	return &DummyMessenger{
// 		events: make(chan e.GameEvent),
// 	}
// }
//
// func (d *DummyMessenger) BroadcastMessage(message []byte) {
// 	log.Printf("BroadcastMessage: %s", message)
// }
//
// func (d *DummyMessenger) SendToPlayer(playerID string, message []byte) {
// 	log.Printf("SendToPlayer [%s]: %s", playerID, message)
// }
//
// // GameEventChannel returns the channel for game events.
// func (d *DummyMessenger) GameEventChannel() <-chan e.GameEvent {
// 	return d.events
// }
//
// func CreatePlayers(numPlayers int) []*shared.Player {
// 	players := make([]*shared.Player, numPlayers)
//
// 	for i := 0; i < numPlayers; i++ {
// 		isHost := i == 0
// 		players[i] = game.NewPlayer(fmt.Sprintf("player %d", i), fmt.Sprintf("player %d", i), isHost)
// 	}
// 	return players
// }
//
// // func TestGameLoop(t *testing.T) {
// // 	var wg sync.WaitGroup
// // 	wg.Add(1)
// //
// // 	gm := g.NewGames()
// // 	newGame := g.NewGame("test", shared.GameOptions{
// // 		MaxPlayers:          4,
// // 		TurnTimeLimit:       10,
// // 		RoundLimit:          3,
// // 		WordSelectTimeLimit: 30,
// // 	}, NewDummyMessenger())
// //
// // 	gm.AddGame(newGame)
// // 	players := CreatePlayers(4)
// // 	for _, player := range players {
// // 		newGame.AddPlayer(player)
// // 	}
// // 	log.Printf("Player order: %v", newGame.PlayerOrder)
// // 	newGame.InitGameEvents()
// //
// // 	// Run the game loop in a goroutine and signal when it exits.
// // 	go func() {
// // 		newGame.Run()
// // 		wg.Done()
// // 	}()
// //
// // 	newGame.Start()
// //
// // 	// Wait for the game loop to exit (i.e. when GameEnded is processed).
// // 	wg.Wait()
// //
// // 	// Now check final state.
// // 	assert.Equal(t, newGame.Status, g.Finished)
// // 	assert.Equal(t, newGame.Round.Count, 3)
// // }
//
// func TestGameLoopWithPlayersGuessed(t *testing.T) {
// 	var wg sync.WaitGroup
// 	wg.Add(1)
//
// 	gm := g.NewGames()
// 	newGame := g.NewGame("test", shared.GameOptions{
// 		MaxPlayers:          4,
// 		TurnTimeLimit:       10,
// 		RoundLimit:          3,
// 		WordSelectTimeLimit: 30,
// 	}, NewDummyMessenger())
//
// 	gm.AddGame(newGame)
// 	players := CreatePlayers(4)
// 	for _, player := range players {
// 		newGame.AddPlayer(player)
// 	}
// 	log.Printf("Player order: %v", newGame.PlayerOrder)
// 	newGame.InitGameEvents()
//
// 	go func() {
// 		for {
// 			time.Sleep(500 * time.Millisecond)
// 			// Check if game has finished.
// 			newGame.Mu.RLock()
// 			finished := newGame.Status == g.Finished
// 			newGame.Mu.RUnlock()
// 			if finished {
// 				break
// 			}
// 			// For testing, simulate that all players guessed correctly on every turn.
// 			newGame.SimulateAllPlayersGuessed()
// 		}
// 	}()
//
// 	// Run the game loop in a goroutine and signal when it exits.
// 	go func() {
// 		newGame.Run()
// 		wg.Done()
// 	}()
//
// 	newGame.Start()
//
// 	// Wait for the game loop to exit (i.e. when GameEnded is processed).
// 	wg.Wait()
//
// 	// Now check final state.
// 	assert.Equal(t, newGame.Status, g.Finished)
// 	assert.Equal(t, newGame.Round.Count, 3)
// }
