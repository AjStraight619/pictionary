import { useGame } from "@/providers/game-provider";
import { useEffect, useState } from "react";
import { isEqual } from "lodash";

// Generic hook to subscribe to specific parts of the game state
export function useGameSelector<T>(selector: (state: any) => T) {
  const { state } = useGame();
  const [selectedState, setSelectedState] = useState(() => selector(state));

  useEffect(() => {
    const newSelectedState = selector(state);
    if (!isEqual(newSelectedState, selectedState)) {
      setSelectedState(newSelectedState);
    }
  }, [state, selector, selectedState]);

  return selectedState;
}

export function usePlayers() {
  return useGameSelector((state) => state.players);
}

export function useGameStatus() {
  return useGameSelector((state) => state.gameStatus);
}

export function useCurrentRound() {
  return useGameSelector((state) => state.round);
}

export function useWordToGuess() {
  return useGameSelector((state) => state.wordToGuess);
}
