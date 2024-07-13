import DrawerCanvas from '@/components/game/canvas/drawer-canvas';
import ViewerCanvas from '@/components/game/canvas/viewer-canvas';
import Chat from '@/components/game/chat';
import Lobby from '@/components/game/lobby';
import Round from '@/components/game/round/round';
import Test from '@/components/test/test';
import WordProvider from '@/context/word-provider';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import dynamic from 'next/dynamic';
import { notFound, redirect } from 'next/navigation';

const DynamicWordList = dynamic(
  () => import('@/components/game/word/word-list'),
  { ssr: false },
);
const DynamicPreGameLobby = dynamic(
  () => import('@/components/game/lobby/pre-game-lobby'),
  { ssr: false },
);

type RoomPageProps = {
  params: {
    roomId: string;
  };
};

const getGame = async (roomId: string) => {
  const game = await db.game.findUnique({
    where: {
      id: roomId,
    },
    include: {
      players: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      rounds: true,
    },
  });
  return game;
};

export default async function Room({ params: { roomId } }: RoomPageProps) {
  const user = await currentUser();
  if (!user || !user.id) redirect('/sign-in');
  const game = await getGame(roomId);

  if (!game) notFound();
  console.log('Game status: ', game.status);
  console.log('Game players: ', game.players);

  const currentRoundIndex = game.currentRound;

  const currentRound = game.rounds[currentRoundIndex - 1];
  const currentDrawerId = currentRound?.drawerId;
  const newWord = currentRound?.word;
  const maxRounds = game.maxRounds;

  console.log('Current word: ', newWord);

  return (
    <WordProvider newWord={newWord} gameId={game.id}>
      <div className="min-h-screen flex flex-col container items-center justify-center gap-y-4 p-6">
        <Test gameId={roomId} />
        <div className="flex flex-row items-center justify-center w-full h-[18rem] gap-x-4">
          <Lobby
            players={game.players}
            showTimer={true}
            rounds={game.rounds}
            currentRound={game.currentRound}
            currentDrawerId={game.currentDrawerId}
            gameId={game.id}
            currentWord={newWord}
            newTurn={game.newTurn}
          />
          <DynamicPreGameLobby
            gameId={game.id}
            players={game.players}
            gameStatus={game.status}
            userId={user.id}
          />
          <Chat players={game.players} userId={user.id} roomId={roomId} />
          <DynamicWordList
            newTurn={game.newTurn}
            roundId={currentRound?.id}
            userId={user.id}
            roomId={roomId}
          />
        </div>
        {/* {currentWord && (
          <WordDisplay
            currentDrawerId={game.currentDrawerId}
            players={game.players}
          />
        )} */}

        <Round
          currentDrawerId={currentDrawerId}
          players={game.players}
          maxRounds={game.maxRounds}
          currentRound={currentRoundIndex}
        />
        <div className="flex flex-row gap-x-2 w-full h-[calc(100vh-34rem)] pb-2">
          <div className="flex-1 h-full">
            <DrawerCanvas userId={user.id} roomId={roomId} />
          </div>
          <div className="flex-1 h-full">
            <ViewerCanvas userId={user.id} roomId={roomId} />
          </div>
        </div>
      </div>
    </WordProvider>
  );
}
