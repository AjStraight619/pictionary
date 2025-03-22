import { useEffect, useMemo } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useGame } from "@/providers/game-provider";
import { Player, PlayerInfo } from "@/types/lobby";
import { GameState, Word } from "@/types/game";
import { useReadLocalStorage } from "usehooks-ts";

const GameStateUpdater = () => {
  const { dispatch, setInitialized } = useGame();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  const messageHandlers = useMemo(
    () => ({
      // When the full game state is sent:
      gameState: (payload: GameState) => {
        dispatch({ type: "GAME_STATE_UPDATE", payload });
        setInitialized(true);
      },
      revealedLetter: (payload: string) => {
        dispatch({
          type: "ADD_REVEALED_LETTER",
          payload,
        });
      },
      drawingPlayerChanged: (payload: Player) => {
        dispatch({ type: "DRAWING_PLAYER_CHANGED", payload });
      },

      selectedWord: (payload: { isSelectingWord: boolean; word: Word }) => {
        dispatch({ type: "SELECTED_WORD", payload });
      },

      scoreUpdated: (payload: { playerID: string; score: number }) => {
        dispatch({ type: "SCORE_UPDATED", payload });
      },

      openSelectWordModal: (payload: {
        isSelectingWord: boolean;
        selectableWords: Word[];
      }) => {
        dispatch({ type: "SELECT_WORD_MODAL", payload });
      },
    }),
    [dispatch, setInitialized]
  );

  const { sendJsonMessage } = useCustomWebsocket({
    messageTypes: [
      "gameState",
      "revealedLetter",
      "drawingPlayerChanged",
      "selectedWord",
      "openSelectWordModal",
    ],
    messageHandlers,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibility changed...");
      if (document.visibilityState === "visible") {
        sendJsonMessage({
          type: "gameState",
          payload: { playerID: playerInfo?.playerID },
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playerInfo?.playerID, sendJsonMessage]);

  return null;
};

export default GameStateUpdater;
