import { useGame } from "@/providers/game-provider";
import { GameState } from "@/types/game";
import { Player } from "@/types/lobby";
import { useMemo } from "react";

export function useGameSelector<T>(selector: (state: GameState) => T): T {
  const { state } = useGame();
  return useMemo(() => selector(state), [state, selector]);
}

export function usePlayers(): GameState["players"] {
  return useGameSelector((state) => state.players);
}

export function useGameStatus(): GameState["status"] {
  return useGameSelector((state) => state.status);
}

export function useCurrentRound(): GameState["round"] {
  return useGameSelector((state) => state.round);
}

export function useWordToGuess():
  | NonNullable<GameState["turn"]>["wordToGuess"]
  | null {
  return useGameSelector((state) =>
    state.turn ? state.turn.wordToGuess : null
  );
}

export function useCurrentDrawer():
  | NonNullable<GameState["round"]>["currentDrawerID"]
  | null {
  return useGameSelector((state) =>
    state.round ? state.round.currentDrawerID : null
  );
}

export function useRevealedLetters(): GameState["revealedLetters"] {
  return useGameSelector((state) => state.revealedLetters);
}

export function useHost(): Player | null {
  return useGameSelector(
    (state) => state.players.find((player) => player.isHost) || null
  );
}

export function useCurrentDrawerFromPlayers(): string | null {
  return useGameSelector((state) => {
    const current = state.players.find((p) => p.isDrawing);
    return current ? current.ID : null;
  });
}

export function useSelectableWords(): GameState["selectableWords"] {
  return useGameSelector((state) => state.selectableWords);
}

export function useIsSelectingWord(): GameState["isSelectingWord"] {
  return useGameSelector((state) => state.isSelectingWord);
}

export function useGameOptions(): GameState["options"] {
  return useGameSelector((state) => state.options);
}

export function useCurrentDrawingPlayer(): Player | null {
  return useGameSelector((state) => {
    const current = state.players.find((p) => p.isDrawing);
    return current ? current : null;
  });
}
