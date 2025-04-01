import { useEffect, useMemo } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useGame } from "@/providers/game-provider";
import { PlayerInfo } from "@/types/lobby";
import { MessageHandlers } from "@/types/messages";
import { useReadLocalStorage } from "usehooks-ts";

const GameStateUpdater = () => {
  const { dispatch } = useGame();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  const messageHandlers: MessageHandlers = useMemo(
    () => ({
      // When the full game state is sent:
      gameState: (payload) => {
        console.log("gameState update: ", payload);
        dispatch({ type: "GAME_STATE_UPDATE", payload });
      },
      revealedLetter: (payload) => {
        dispatch({
          type: "ADD_REVEALED_LETTER",
          payload,
        });
      },
      drawingPlayerChanged: (payload) => {
        dispatch({ type: "DRAWING_PLAYER_CHANGED", payload });
      },

      selectedWord: (payload) => {
        dispatch({ type: "SELECTED_WORD", payload });
      },

      scoreUpdated: (payload) => {
        dispatch({ type: "SCORE_UPDATED", payload });
      },

      playerReady: (payload) => {
        dispatch({ type: "PLAYER_READY", payload });
      },

      openSelectWordModal: (payload) => {
        dispatch({ type: "SELECT_WORD_MODAL", payload });
      },
    }),
    [dispatch]
  );

  const { sendTypedMessage } = useCustomWebsocket({
    messageTypes: [
      "gameState",
      "gameStateRequest",
      "revealedLetter",
      "drawingPlayerChanged",
      "selectedWord",
      "openSelectWordModal",
      "scoreUpdated",
      "playerReady",
    ],
    messageHandlers,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibility changed...");
      if (document.visibilityState === "visible" && playerInfo?.playerID) {
        sendTypedMessage("gameStateRequest", { playerID: playerInfo.playerID });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playerInfo?.playerID, sendTypedMessage]);

  return null;
};

export default GameStateUpdater;
