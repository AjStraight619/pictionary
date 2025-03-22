import { useHost } from "@/hooks/useGameSelector";
import { usePlayers, useGameStatus } from "@/hooks/useGameSelector";
import { GameStatus } from "@/types/game";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import { useReadLocalStorage } from "usehooks-ts";
import { PlayerInfo } from "@/types/lobby";
import { useLocation } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PlayerCard from "../player/player-card";

const PreGameLobby = () => {
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const players = usePlayers();
  const gameStatus = useGameStatus();
  const host = useHost();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  const { stopTimer, startTimer, timeRemaining, setTimeRemaining } = useTimer({
    timerType: "startGameCountdown",
    messageTypes: ["startGameCountdown"],
  });

  const open = gameStatus === GameStatus.NotStarted;

  function copyToClipboard(text: string) {
    setCopied(true);
    navigator.clipboard.writeText(text);
    setTimeout(() => setCopied(false), 2000);
  }

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

  // Instead of manually searching, use our host hook:
  const isHost = host && host.ID === playerInfo?.playerID;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
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
              key={player.ID}
              isHost={player.isHost}
              isDrawing={player.isDrawing}
              name={player.username}
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
