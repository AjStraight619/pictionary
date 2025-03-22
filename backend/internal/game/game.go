package game

import (
	"context"
	"slices"
	"sync"
	"time"

	m "github.com/Ajstraight619/pictionary-server/internal/messaging"
	"github.com/Ajstraight619/pictionary-server/internal/shared"
)

type Game struct {
	lifecycle   GameLifecycle             `json:"-"`
	Mu          sync.RWMutex              `json:"-"`
	ID          string                    `json:"id"`
	Players     map[string]*shared.Player `json:"players"`
	PlayerOrder []string                  `json:"playerOrder"`
	timers      map[string]*Timer         `json:"-"`
	Options     shared.GameOptions        `json:"options"`
	Status      Status                    `json:"status"`
	FlowSignal  chan FlowEvent            `json:"-"`
	CurrentTurn *Turn                     `json:"currentTurn"`
	Round       *Round                    `json:"round"`
	Messenger   m.Messenger               `json:"-"`
	GameEvents  map[string]EventHandler   `json:"-"`
	// SelectableWords []shared.Word             `json:"selectableWords"`
	UsedWords       []shared.Word `json:"-"`
	AvailableColors []string      `json:"-"`
	// isSelectingWord bool
	TimerManager *TimerManager
	WordSelector *WordSelector
	FlowManager  *FlowManager
	ctx          context.Context `json:"-"`
	lastActivity time.Time       `json:"-"`
}

func NewGame(ctx context.Context, id string, options shared.GameOptions, messenger m.Messenger, lifecycle GameLifecycle) *Game {
	game := &Game{
		ID:          id,
		lifecycle:   lifecycle,
		Players:     make(map[string]*shared.Player),
		timers:      make(map[string]*Timer),
		PlayerOrder: []string{},
		Options:     options,
		Status:      NotStarted,
		FlowSignal:  make(chan FlowEvent, 1),
		Messenger:   messenger,
		GameEvents:  make(map[string]EventHandler),
		UsedWords:   []shared.Word{},
		// SelectableWords: []shared.Word{},
		AvailableColors: slices.Clone(defaultColors),
		ctx:             ctx,
		lastActivity:    time.Now(),
	}
	game.TimerManager = NewTimerManager(game)
	game.WordSelector = NewWordSelector(game)
	game.FlowManager = NewFlowManager(game)
	game.Round = InitRound()
	game.CurrentTurn = InitTurn()
	return game
}
