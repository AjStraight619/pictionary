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

  function copyToClipboard(text: string) {
    setCopied(true);
    navigator.clipboard.writeText(text);
    setTimeout(() => setCopied(false), 2000);
  }

  const { lastMessage, connectionStatus } = useCustomWebsocket({
    messageTypes: ["gameState"],
  });

  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  const { players } = useGame();

  const { stopTimer, startTimer, timeRemaining } = useTimer({
    timerType: "startGameTimer",
    messageTypes: ["startGameTimer"],
  });
  const [open, setOpen] = useState(false);
  const [gameStarting, setGameStarting] = useState(false);

  const handleStartGame = () => {
    startTimer();
    setGameStarting(true);
  };
  const handleCancelGame = () => {
    stopTimer();
    setGameStarting(false);
  };

  const isLeader = players.find(
    (p) => p.isLeader && p.playerId === playerInfo?.playerId,
  );

  useEffect(() => {
    if (lastMessage) {
      const gameStatus = JSON.parse(lastMessage.data).payload.gameState.status;

      switch (gameStatus) {
        case GameStatus.StatusNotStarted:
          setOpen(true);
          break;

        case GameStatus.StatusInProgress:
          setOpen(false);
          break;

        case GameStatus.StatusFinished:
          console.log("Game has finished!");
          break;

        default:
          console.warn("Unhandled game status:", gameStatus);
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
          {players.map((player) => (
            <PlayerCard
              key={player.playerId}
              isLeader={player.isLeader}
              isDrawing={player.isDrawing}
              name={player.username}
              connectionStatus={connectionStatus}
              score={player.score}
              color={player.color}
            />
          ))}
        </div>
        <DialogFooter>
          {isLeader && (
            <Button
              onClick={() =>
                copyToClipboard(location.pathname.split("/").pop()!)
              }
            >
              {copied ? "Copied!" : "Copy Game Link"}
            </Button>
          )}

          {isLeader ? (
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
