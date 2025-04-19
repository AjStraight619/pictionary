import { useEffect, useMemo } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useGame } from "@/providers/game-provider";
import { PlayerInfo } from "@/types/lobby";
import { MessageHandlers } from "@/types/messages";
import { useReadLocalStorage } from "usehooks-ts";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const GameStateUpdater = () => {
  const { dispatch } = useGame();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  const navigate = useNavigate();

  const messageHandlers: MessageHandlers = useMemo(
    () => ({
      // When the full game state is sent:
      gameState: (payload) => {
        console.log("gameState update: ", payload);
        dispatch({ type: "GAME_STATE_UPDATE", payload });
      },
      revealedLetters: (payload: (number | string)[]) => {
        // Turn [95, 95, 109, 95, 114] → ["", "", "m", "", "r"]
        const letters = payload.map((code) => {
          // normalize to a number
          const n = typeof code === "string" ? +code : code;
          // if it’s the underscore code, return empty—otherwise char
          return n === 95 ? "" : String.fromCharCode(n);
        });

        dispatch({
          type: "ADD_REVEALED_LETTER",
          payload: letters,
        });
      },
      drawingPlayerChanged: (payload) => {
        dispatch({ type: "DRAWING_PLAYER_CHANGED", payload });
      },

      cursorUpdate: (payload) => {
        dispatch({ type: "CURSOR_UPDATE", payload });
      },

      selectedWord: (payload) => {
        dispatch({ type: "SELECTED_WORD", payload });
      },

      scoreUpdated: (payload) => {
        console.log("💰 Score update received:", payload);
        dispatch({ type: "SCORE_UPDATED", payload });
      },

      playerReady: (payload) => {
        dispatch({ type: "PLAYER_READY", payload });
      },

      openSelectWordModal: (payload) => {
        dispatch({ type: "SELECT_WORD_MODAL", payload });
      },

      letterRevealed: (payload) => {
        console.log("Letter revealed");
        dispatch({ type: "LETTER_REVEALED", payload });
      },

      playerJoined: (payload) => {
        const joinTime = new Date(payload.player.joinedAt).getTime();

        // If the player joined within the last 10 seconds, show a toast. This prevents reloads from showing a toast.
        if (
          isWithinDiffTime(joinTime, 10000) &&
          payload.player.ID !== playerInfo?.playerID
        ) {
          toast(`${payload.player.username} joined the game`);
        }
      },
      playerLeft: (payload) => {
        if (payload.player.ID === playerInfo?.playerID) {
          navigate("/");
        }

        const leftTime = new Date(payload.player.leftAt).getTime();

        if (isWithinDiffTime(leftTime, 10000)) {
          toast(`${payload.player.username} left the game`);
        }
      },
      playerRemoved: (payload) => {
        console.log("Player removed event received:", payload);
        if (payload.player.ID === playerInfo?.playerID) {
          console.log("This is me being removed! Redirecting to home...");
          navigate("/");
        }
        toast(`${payload.player.username} was removed from the game`);
      },
    }),
    [dispatch, playerInfo?.playerID, navigate]
  );

  const { sendWSMessage } = useCustomWebsocket({
    messageTypes: [
      "gameState",
      "gameStateRequest",
      "letterRevealed",
      "revealedLetters",
      "drawingPlayerChanged",
      "selectedWord",
      "openSelectWordModal",
      "scoreUpdated",
      "playerReady",
      "cursorUpdate",
      "playerJoined",
      "playerLeft",
      "playerRemoved",
    ],
    messageHandlers,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log("Visibility changed...");
      if (document.visibilityState === "visible" && playerInfo?.playerID) {
        sendWSMessage("gameStateRequest", { playerID: playerInfo.playerID });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [playerInfo?.playerID, sendWSMessage]);

  return null;
};

export default GameStateUpdater;

// Returns true if the time is within the last diff milliseconds
const isWithinDiffTime = (time: number, diff: number) => {
  const now = Date.now();
  const timeDiff = now - time;
  return timeDiff < diff;
};
