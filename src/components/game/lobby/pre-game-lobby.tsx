import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useGame } from "@/providers/game-provider";
import { GameStatus } from "@/types/game";

import { useEffect, useState } from "react";
import PlayerCard from "./player-card";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import { useReadLocalStorage } from "usehooks-ts";
import { PlayerInfo } from "@/types/lobby";
import { useLocation } from "react-router";

const PreGameLobby = () => {
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const { state } = useGame();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  function copyToClipboard(text: string) {
    setCopied(true);
    navigator.clipboard.writeText(text);
    setTimeout(() => setCopied(false), 2000);
  }

  const { lastMessage, connectionStatus } = useCustomWebsocket({
    messageTypes: ["gameState", "gameStarted"],
  });

  const { stopTimer, startTimer, timeRemaining, setTimeRemaining } = useTimer({
    timerType: "startGameCountdown",
    messageTypes: ["startGameCountdown"],
  });
  const [open, setOpen] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);

  const handleStartGame = () => {
    startTimer();
    setGameStarting(true);
  };
  const handleCancelGame = () => {
    setTimeRemaining(null);
    stopTimer();
    setGameStarting(false);
  };

  const isHost = state.players.find(
    (p) => p.isHost && p.playerID === playerInfo?.playerID,
  );

  useEffect(() => {
    if (lastMessage) {
      const gameStatus = JSON.parse(lastMessage.data).payload.gameState.status;

      console.log("gameStatus: ", gameStatus);

      switch (gameStatus) {
        case GameStatus.NotStarted:
          setOpen(true);
          break;

        case GameStatus.InProgress:
          setOpen(false);
          break;

        case GameStatus.Finished:
          console.log("Game has finished!");
          break;

        default:
          return;
      }
    }
  }, [lastMessage]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle>Players</DialogTitle>
        <DialogDescription>Waiting for players to join...</DialogDescription>
        <div className="grid grid-cols-2 grid-rows-4 gap-2 grid-flow-col">
          {state.players.map((player) => (
            <PlayerCard
              key={player.playerID}
              isHost={player.isHost}
              isDrawing={player.isDrawing}
              name={player.username}
              connectionStatus={connectionStatus}
              score={player.score}
              color={player.color}
            />
          ))}
        </div>
        <DialogFooter>
          {isHost && (
            <Button
              onClick={() =>
                copyToClipboard(location.pathname.split("/").pop()!)
              }
            >
              {copied ? "Copied!" : "Copy Game Link"}
            </Button>
          )}

          {isHost ? (
            gameStarting ? (
              <Button onClick={handleCancelGame}>Cancel {timeRemaining}</Button>
            ) : (
              <Button onClick={handleStartGame}>Start Game</Button>
            )
          ) : gameStarting ? (
            <p>Game starting {timeRemaining}</p>
          ) : (
            <p>Waiting for leader to start the game...</p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreGameLobby;
