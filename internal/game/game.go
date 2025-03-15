package game

import (
	"log"
	"sync"
	"time"

	e "github.com/Ajstraight619/pictionary-server/internal/events"
	m "github.com/Ajstraight619/pictionary-server/internal/messaging"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
	"github.com/Ajstraight619/pictionary-server/internal/utils"
)

type Status int

const (
	NotStarted Status = iota
	InProgress
	Finished
)

var defaultColors = []string{
	"#FF0000",
	"#00FF00",
	"#0000FF",
	"#FFFF00",
	"#FF00FF",
	"#00FFFF",
	"#FFA500",
	"#800080",
}

type Game struct {
	Mu              sync.RWMutex              `json:"-"`
	ID              string                    `json:"id"`
	Players         map[string]*shared.Player `json:"players"`
	PlayerOrder     []string                  `json:"playerOrder"`
	timers          map[string]*Timer         `json:"-"`
	Options         shared.GameOptions        `json:"options"`
	Status          Status                    `json:"status"`
	FlowSignal      chan FlowEvent            `json:"-"`
	CurrentTurn     *Turn                     `json:"currentTurn"`
	Round           *Round                    `json:"round"`
	Messenger       m.Messenger               `json:"-"`
	GameEvents      map[string]EventHandler   `json:"-"`
	SelectableWords []shared.Word             `json:"selectableWords"`
	UsedWords       []shared.Word             `json:"-"`
	AvailableColors []string                  `json:"-"`
	isSelectingWord bool
	TimerManager    *TimerManager
	WordSelector    *WordSelector
	FlowManager     *FlowManager
}

type Games struct {
	games map[string]*Game
}

func NewGames() *Games {
	return &Games{
		games: make(map[string]*Game),
	}
}

func (gs *Games) AddGame(game *Game) {
	gs.games[game.ID] = game
}

func (gs *Games) GetGameByID(id string) (*Game, bool) {
	game, ok := gs.games[id]
	return game, ok
}

func NewGame(id string, options shared.GameOptions, messenger m.Messenger) *Game {
	game := &Game{
		ID:              id,
		Players:         make(map[string]*shared.Player),
		timers:          make(map[string]*Timer),
		PlayerOrder:     []string{},
		Options:         options,
		Status:          NotStarted,
		FlowSignal:      make(chan FlowEvent, 1),
		Messenger:       messenger,
		GameEvents:      make(map[string]EventHandler),
		UsedWords:       []shared.Word{},
		SelectableWords: []shared.Word{},
		AvailableColors: append([]string(nil), defaultColors...),
	}
	game.TimerManager = NewTimerManager(game)
	game.WordSelector = NewWordSelector(game)
	game.FlowManager = NewFlowManager(game)
	game.Round = InitRound()
	game.CurrentTurn = InitTurn()
	return game
}

func (g *Game) Run() {
	for {
		select {
		case flow := <-g.FlowSignal:
			g.FlowManager.HandleFlow(flow)
		case event := <-g.Messenger.GameEventChannel():
			g.handleExternalEvent(event)
		}
	}
}

func (fm *FlowManager) handleGameStarted() {
	fm.game.FlowSignal <- RoundStarted
}

func (g *Game) Start() {
	g.BroadcastGameState()
	time.AfterFunc(2*time.Second, func() {
		g.FlowSignal <- GameStarted
	})
}

func (g *Game) StartGameCountdown(timerType string, duration int) {

	timer := NewTimer(timerType, duration)
	g.timers[timerType] = timer

	onFinish := func() {
		log.Println("Game countdown finished")
		g.Mu.Lock()
		g.Status = InProgress
		g.Mu.Unlock()
		g.Start()
	}

	onCancel := func() {
		log.Println("Game countdown cancelled")
		g.Mu.Lock()
		g.Status = NotStarted
		g.Mu.Unlock()
		g.CancelTimer(timerType)

	}

	go func() {
		for remaining := range timer.StartCountdown(onFinish, onCancel) {

			msgType := "startGameCountdown"
			payload := map[string]interface{}{
				"timeRemaining": remaining,
			}

			b, err := utils.CreateMessage(msgType, payload)

			if err != nil {
				log.Println("error marshalling message")
				return
			}
			g.Messenger.BroadcastMessage(b)
		}
	}()

}

func (g *Game) GetCurrentDrawer() *shared.Player {
	g.Mu.RLock()
	defer g.Mu.RUnlock()
	if len(g.PlayerOrder) == 0 {
		return nil
	}
	currentID := g.PlayerOrder[g.Round.CurrentDrawerIdx]
	return g.Players[currentID]
}

func (g *Game) CheckForHost() bool {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	for _, player := range g.Players {
		if player.IsHost {
			return true
		}
	}
	return false
}

func (g *Game) handleExternalEvent(event e.GameEvent) {
	g.Mu.RLock()
	handler, exists := g.GameEvents[event.Type]
	g.Mu.RUnlock()

	if exists {
		log.Printf("Dispatching custom handler for event type: %s", event.Type)
		go handler(event.Payload)
		return
	}
}

func (g *Game) ClearDrawingPlayers() {
	g.Mu.Lock()
	defer g.Mu.Unlock()
	for _, player := range g.Players {
		player.IsDrawing = false
	}
}
