"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GamePlayer, GameStatus } from "@prisma/client";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PlayersList from "./players-list";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import SubmitButton2 from "@/components/ui/submit-button2";
import { wait } from "@/lib/utils";
import { startGame } from "@/actions/game";

type PreGameLobbyProps = {
  players: GamePlayer[];
  gameStatus: GameStatus;
  gameId: string;
  userId: string;
};

export default function PreGameLobby({
  players,
  gameStatus,
  gameId,
  userId,
}: PreGameLobbyProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(
    gameStatus === GameStatus.WAITING
  );

  useEffect(() => {
    console.log("Game status changed..: ", gameStatus);
    setIsDialogOpen(gameStatus === GameStatus.WAITING);
  }, [gameStatus]);

  const leader = players.find((p) => p.isLeader && p.playerId === userId);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent
        onEscapeKeyDown={(e: any) => e.preventDefault()}
        onInteractOutside={(e: any) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Pre Game Lobby</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-y-6 w-full">
          <PlayersList
            showScore={false}
            players={players}
            currentDrawerId={null}
            roomId={gameId}
          />
          <Separator />
          <GameRules gameId={gameId} leader={leader} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

type TimerOptions = "80" | "100" | "120";
type MaxPlayers = "2" | "3" | "4" | "5" | "6";
type MaxRounds = "8" | "10" | "12";

type GameRulesType = {
  timer: TimerOptions;
  maxPlayers: MaxPlayers;
  maxRounds: MaxRounds;
};

type GameRulesProps = {
  gameId: string;
  leader: GamePlayer | undefined;
};

function GameRules({ gameId, leader }: GameRulesProps) {
  const [gameRules, setGameRules] = useState<GameRulesType>({
    timer: "80",
    maxPlayers: "6",
    maxRounds: "8",
  });

  const handleUpdateGameRules = async (formData: FormData) => {
    formData.append("timer", String(gameRules.timer));
    formData.append("maxPlayers", String(gameRules.maxPlayers));
    formData.append("gameId", gameId);
    formData.append("leader", JSON.stringify(leader));
    await startGame(formData);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <h3 className="text-xl col-span-2">Game Rules:</h3>
      <form
        action={handleUpdateGameRules}
        className="col-span-2 grid grid-cols-2 gap-4"
      >
        <div className="flex flex-col space-y-2">
          <Label className="text-lg font-roboto" htmlFor="timer">
            Round Timer:
          </Label>
          <Select
            disabled={!leader}
            name="timer"
            value={gameRules.timer}
            onValueChange={(v) =>
              setGameRules((prevGameRules) => ({
                ...prevGameRules,
                timer: v as TimerOptions,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="80" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="80">80</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="120">120</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col space-y-2">
          <Label className="text-lg font-roboto" htmlFor="maxRounds">
            Max Players:
          </Label>
          <Select
            disabled={!leader}
            name="maxPlayers"
            value={gameRules.maxPlayers}
            onValueChange={(v) =>
              setGameRules((prevGameRules) => ({
                ...prevGameRules,
                maxPlayers: v as MaxPlayers,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="6" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="6">6</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col space-y-2">
          <Label className="text-lg font-roboto" htmlFor="maxPlayers">
            Rounds:
          </Label>
          <Select
            disabled={!leader}
            name="maxRounds"
            value={gameRules.maxRounds}
            onValueChange={(v) =>
              setGameRules((prevGameRules) => ({
                ...prevGameRules,
                maxRounds: v as MaxRounds,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="8" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="12">12</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <SubmitButton2 className="col-span-2 mt-4">Start</SubmitButton2>
      </form>
    </div>
  );
}
