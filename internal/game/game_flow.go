package game

import "log"

type FlowEvent int

const (
	GameStarted FlowEvent = iota
	RoundStarted
	TurnStarted
	TurnEnded
	RoundEnded
	GameEnded
)

type FlowManager struct {
	game *Game
}

func NewFlowManager(game *Game) *FlowManager {
	return &FlowManager{game: game}
}

func (fm *FlowManager) HandleFlow(flow FlowEvent) {
	switch flow {
	case GameStarted:
		fm.handleGameStarted()
	case RoundStarted:
		fm.handleRoundStarted()
	case TurnStarted:
		fm.handleTurnStarted()
	case TurnEnded:
		fm.handleTurnEnded()
	case RoundEnded:
		fm.handleRoundEnded()
	case GameEnded:
		log.Println("Game ended")
		return
	}
}
