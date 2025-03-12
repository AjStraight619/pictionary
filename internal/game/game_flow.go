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
		fm.game.FlowSignal <- RoundStarted
	case RoundStarted:
		fm.game.Round.Start(fm.game)
	case TurnStarted:
		fm.game.BroadcastGameState()
		if fm.game.CurrentTurn.WordToGuess == nil {
			log.Println("Word is nil, selecting new word")
			fm.game.WordSelector.SelectWord()
		} else {
			drawer := fm.game.GetCurrentDrawer()
			if drawer != nil {
				log.Println("Starting turn for drawer")
				fm.game.CurrentTurn.Start(fm.game, drawer.ID)
			} else {
				log.Println("No current drawer found; cannot start turn.")
			}
		}
	case TurnEnded:
		fm.game.CurrentTurn.End(fm.game)
	case RoundEnded:
		log.Printf("Round %d ended", fm.game.Round.Count)
		fm.game.Round.Next(fm.game)
		fm.game.FlowSignal <- RoundStarted
	case GameEnded:
		log.Println("Game ended")
		return
	}
}
