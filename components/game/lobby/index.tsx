import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GamePlayer } from '@prisma/client';
import PlayersList from './players-list';

import RoundTimer from '../timer/round-timer';

type LobbyProps = {
  players: GamePlayer[];
  newTurn: boolean;
  currentDrawerId: string | null;
  gameId?: string;
};

export default function Lobby({
  players,
  newTurn,
  currentDrawerId,
  gameId,
}: LobbyProps) {
  console.log('Current drawer id in Lobby: ', currentDrawerId);

  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lobby</CardTitle>
        <RoundTimer newTurn={newTurn} roomId={gameId!} />
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
