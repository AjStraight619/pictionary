"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GamePlayer, GameStatus } from "@prisma/client";
import Lobby from ".";
import { useState, useEffect } from "react";

type PreGameLobbyProps = {
  players: GamePlayer[];
  gameStatus: GameStatus;
};

export default function PreGameLobby({
  players,
  gameStatus,
}: PreGameLobbyProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(
    gameStatus === GameStatus.WAITING
  );

  useEffect(() => {
    setIsDialogOpen(gameStatus === GameStatus.WAITING);
  }, [gameStatus]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Pre Game Lobby</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Lobby
            players={players}
            showScore={false}
            showTimer={false}
            currentDrawerId={null}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GameRules() {
  return <div className="grid grid-cols-2"></div>;
}
