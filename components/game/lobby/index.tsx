import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GamePlayer, Round } from "@prisma/client";
import PlayersList from "./players-list";
import { startNewRound } from "@/actions/round";
import { Button } from "@/components/ui/button";
import { proceedGame } from "@/actions/game";
import WordDisplay from "../word/word-display";

type LobbyProps = {
  players: GamePlayer[];
  currentRound?: number;
  rounds?: Round[];
  currentDrawerId: string | null;
  showTimer?: boolean;
  showScore?: boolean;
  gameId?: string;
  currentWord?: string;
};

export default function Lobby({
  players,
  showTimer,
  showScore,
  currentRound,
  currentDrawerId,
  rounds,
  gameId,
  currentWord,
}: LobbyProps) {
  const handleStartNewRound = async (formData: FormData) => {
    const gameId = formData.get("gameId") as string;
    await startNewRound(gameId);
  };

  const handleProceedGame = async (formData: FormData) => {
    const gameId = formData.get("gameId") as string;
    await proceedGame(gameId);
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lobby</CardTitle>
        {/* <div>{showTimer && <Timer />}</div> */}
        <div>{currentWord}</div>
        <form
          action={async (formData) => {
            "use server";
            formData.append("gameId", gameId as string);
            await handleStartNewRound(formData);
          }}
        >
          <div className="flex items-center gap-x-2">
            <div>{currentRound} / 8</div>
          </div>
        </form>

        <form
          action={async (formData) => {
            "use server";
            formData.append("gameId", gameId as string);
            await handleProceedGame(formData);
          }}
        >
          <Button type="submit">Proceed Game</Button>
        </form>
      </CardHeader>
      <CardContent>
        <PlayersList
          players={players}
          showScore={true}
          currentDrawerId={currentDrawerId}
        />
      </CardContent>
    </Card>
  );
}
