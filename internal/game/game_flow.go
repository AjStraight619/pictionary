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
		fm.handleGameEnded()
		return
	}
}

func (fm *FlowManager) handleGameStarted() {
	fm.game.FlowSignal <- RoundStarted
}

func (fm *FlowManager) handleGameEnded() {
	fm.game.Mu.Lock()
	fm.game.Status = Finished
	fm.game.Mu.Unlock()
	fm.game.BroadcastGameState()
	fm.game.cleanup()
}

func (fm *FlowManager) handleRoundStarted() {
	fm.game.BroadcastGameState()
	fm.game.Round.Start(fm.game)
}

func (fm *FlowManager) handleRoundEnded() {
	log.Printf("Round %d ended", fm.game.Round.Count)
	if fm.game.Round.Count == fm.game.Options.RoundLimit {
		log.Println("Game over!")
		fm.game.FlowSignal <- GameEnded
		return
	}
	fm.game.Round.Next(fm.game)
}

func (fm *FlowManager) handleTurnStarted() {
	fm.game.BroadcastGameState()
	turn := fm.game.CurrentTurn

	log.Printf("Turn started: %v", turn)

	switch turn.Phase {
	case PhaseWordSelection:
		if turn.WordToGuess == nil {
			log.Println("No word selected. Initiating word selection...")
			fm.game.WordSelector.SelectWord()
			return
		}
		log.Println("Word selected. Switching to drawing phase.")
		turn.Phase = PhaseDrawing
		fm.handleTurnStarted()
	case PhaseDrawing:
		drawer := fm.game.Round.GetCurrentDrawer(fm.game.Players, fm.game.PlayerOrder)
		if drawer == nil {
			log.Println("No current drawer found; cannot start turn.")
			return
		}
		log.Println("Starting drawing phase for drawer", drawer.ID)
		turn.Start(fm.game, drawer.ID)
	default:
		log.Println("Unknown turn phase encountered.")
	}
}

func (fm *FlowManager) handleTurnEnded() {
	fm.game.CurrentTurn.End(fm.game)
}
