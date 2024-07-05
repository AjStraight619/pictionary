import DrawerCanvas from "@/components/game/canvas/drawer-canvas";
import ViewerCanvas from "@/components/game/canvas/viewer-canvas";
import Chat from "@/components/game/chat";
import Lobby from "@/components/game/lobby";
import WordDisplay from "@/components/game/word/word-display";
import WordProvider from "@/context/word-provider";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import dynamic from "next/dynamic";
import { notFound, redirect } from "next/navigation";

const DynamicWordList = dynamic(
  () => import("@/components/game/word/word-list"),
  { ssr: false }
);
const DynamicPreGameLobby = dynamic(
  () => import("@/components/game/lobby/pre-game-lobby"),
  { ssr: false }
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
          createdAt: "asc",
        },
      },
      rounds: true,
    },
  });
  return game;
};

export default async function Room({ params: { roomId } }: RoomPageProps) {
  const user = await currentUser();
  if (!user || !user.id) redirect("/sign-in");
  const game = await getGame(roomId);

  if (!game) notFound();

  const currentRoundIndex = game.currentRound;
  const currentRound = game.rounds[currentRoundIndex - 1];
  const currentWord = currentRound?.word;

  return (
    <WordProvider word={currentWord} gameId={game.id}>
      <div className="min-h-screen flex flex-col container items-center justify-center gap-y-4 p-6">
        <div className="flex flex-row items-center justify-center w-full h-[18rem] gap-x-4">
          <Lobby
            players={game.players}
            showTimer={true}
            rounds={game.rounds}
            currentRound={game.currentRound}
            currentDrawerId={game.currentDrawerId}
            gameId={game.id}
            currentWord={currentWord}
          />
          <DynamicPreGameLobby
            gameId={game.id}
            players={game.players}
            gameStatus={game.status}
          />
          <Chat players={game.players} userId={user.id} roomId={roomId} />
          <DynamicWordList
            newTurn={game.newTurn}
            roundId={currentRound?.id}
            userId={user.id}
            roomId={roomId}
          />
        </div>
        {currentWord && (
          <WordDisplay
            userId={user.id}
            roomId={roomId}
            currentDrawerId={game.currentDrawerId}
            players={game.players}
          />
        )}
        <div className="flex flex-row gap-x-2 w-full h-[calc(100vh-20rem-10rem)] pb-2">
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
