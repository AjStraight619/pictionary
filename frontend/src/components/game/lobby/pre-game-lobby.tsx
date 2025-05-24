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

  const gameStarting = timeRemaining !== null;

  const open = gameStatus === GameStatus.NotStarted;

  const { sendWSMessage } = useCustomWebsocket({
    messageTypes: ["playerReady", "playerToggleReady"],
  });

  const copyToClipboard = (text: string) => {
    setCopied(true);
    navigator.clipboard.writeText(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    startTimer();
  };

  const handleCancelGame = () => {
    setTimeRemaining(null);
    stopTimer();
  };

  const toggleReady = () => {
    if (playerInfo?.playerID) {
      sendWSMessage("playerToggleReady", {
        playerID: playerInfo.playerID,
      });
    }
  };

  const isHost = host && host.ID === playerInfo?.playerID;

  return (
    <Dialog open={open}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle>Players</DialogTitle>
        <DialogDescription>Waiting for players to join...</DialogDescription>
        <div
          className={`grid gap-2 ${
            players.length > 4 ? "grid-cols-2" : "grid-cols-1"
          } auto-rows-auto w-full`}
        >
          {players.map((player) => (
            <PlayerCard
              key={player.ID}
              isHost={player.isHost}
              isDrawing={player.isDrawing}
              name={player.username}
              playerId={player.ID}
              color={player.color}
              isReady={player.ready}
              isPreGame={true}
            />
          ))}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <ReadyButton
            isReady={players.find((p) => p.ID === playerInfo?.playerID)?.ready}
            onToggle={toggleReady}
          />

          <div className="flex ml-auto gap-2 items-center">
            {isHost && (
              <CopyLinkButton
                gameId={location.pathname.split("/").pop() || ""}
                disabled={gameStarting}
                copied={copied}
                onCopy={copyToClipboard}
              />
            )}

            <GameControlButton
              isHost={!!isHost}
              gameStarting={gameStarting}
              timeRemaining={timeRemaining}
              playersCount={players.length}
              onStart={handleStartGame}
              onCancel={handleCancelGame}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Component type definitions
type ReadyButtonProps = {
  isReady?: boolean;
  onToggle: () => void;
};

type CopyLinkButtonProps = {
  gameId: string;
  disabled: boolean;
  copied: boolean;
  onCopy: (text: string) => void;
};

type GameControlButtonProps = {
  isHost: boolean;
  gameStarting: boolean;
  timeRemaining: number | null;
  playersCount: number;
  onStart: () => void;
  onCancel: () => void;
};

const ReadyButton = ({ isReady, onToggle }: ReadyButtonProps) => (
  <Button onClick={onToggle} variant={isReady ? "outline" : "default"}>
    {isReady ? "Cancel Ready" : "Ready"}
  </Button>
);

const CopyLinkButton = ({
  gameId,
  disabled,
  copied,
  onCopy,
}: CopyLinkButtonProps) => (
  <Button disabled={disabled} onClick={() => onCopy(gameId)} variant="outline">
    {copied ? "Copied!" : "Copy Game ID"}
  </Button>
);

const GameControlButton = ({
  isHost,
  gameStarting,
  timeRemaining,
  playersCount,
  onStart,
  onCancel,
}: GameControlButtonProps) => {
  const notEnoughPlayers = playersCount < 2;

  if (isHost) {
    if (gameStarting) {
      return (
        <Button onClick={onCancel} variant="destructive">
          Cancel {timeRemaining || ""}
        </Button>
      );
    }

    return (
      <Button onClick={onStart} disabled={notEnoughPlayers}>
        Start Game
      </Button>
    );
  }

  if (gameStarting) {
    return <p className="text-sm">Game starting {timeRemaining || ""}</p>;
  }

  return <p className="text-sm">Waiting for leader to start...</p>;
};

export default PreGameLobby;
