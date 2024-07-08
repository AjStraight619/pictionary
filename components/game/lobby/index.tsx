import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GamePlayer, Round } from "@prisma/client";
import PlayersList from "./players-list";
import { startNewRound } from "@/actions/round";
import { Button } from "@/components/ui/button";
import { proceedGame } from "@/actions/game";
import WordDisplay from "../word/word-display";
import RoundTimer from "../timer/round-timer";

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
  console.log("Current drawer id in Lobby: ", currentDrawerId);
  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lobby</CardTitle>
        <RoundTimer roomId={gameId!} />
        <form
          action={async () => {
            "use server";
            await startNewRound(gameId as string);
          }}
        >
          <div className="flex items-center gap-x-2">
            <div>{currentRound} / 8</div>
          </div>
        </form>

        <form
          action={async () => {
            "use server";
            await proceedGame(gameId as string);
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
          roomId={gameId!}
        />
      </CardContent>
    </Card>
  );
}
