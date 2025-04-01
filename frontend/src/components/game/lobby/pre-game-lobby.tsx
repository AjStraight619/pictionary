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
import PlayerCard from "./player-card";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

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

  const { sendTypedMessage } = useCustomWebsocket({
    messageTypes: ["playerReady", "playerToggleReady"],
  });

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

  const toggleReady = () => {
    if (playerInfo?.playerID) {
      sendTypedMessage("playerToggleReady", {
        playerID: playerInfo.playerID,
      });
    }
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
        <div
          className={`grid gap-2 ${
            players.length > 4 ? "grid-cols-2 grid-flow-col" : "grid-cols-1"
          }`}
        >
          {players.map((player) => (
            <PlayerCard
              key={player.ID}
              isHost={player.isHost}
              isDrawing={player.isDrawing}
              name={player.username}
              score={player.score}
              color={player.color}
              isReady={player.ready}
            />
          ))}
        </div>
        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button onClick={toggleReady}>
              {players.find((p) => p.ID === playerInfo?.playerID)?.ready
                ? "Cancel Ready"
                : "Ready"}
            </Button>
            <div className="space-x-2">
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
                  <Button onClick={handleCancelGame}>
                    Cancel {timeRemaining}
                  </Button>
                ) : (
                  <Button onClick={handleStartGame}>Start Game</Button>
                )
              ) : gameStarting ? (
                <p>Game starting {timeRemaining}</p>
              ) : (
                <p>Waiting for leader to start the game...</p>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreGameLobby;
