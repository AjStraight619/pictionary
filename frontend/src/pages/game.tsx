import CanvasComponent from '@/components/game/canvas/canvas';
import Chat from '@/components/game/chat/chat';
import Lobby from '@/components/game/lobby/lobby';
import Timer from '@/components/game/timer/timer';
import WordFetcher from '@/components/game/word/word';

const Game = () => {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      {/* <WordFetcher /> */}
      <Timer />
      <div className="flex flex-row items-center justify-center w-full container gap-x-4">
        <Lobby />
        <Chat />
      </div>
      <div className="flex flex-row items-center">
        <CanvasComponent />
        {/* <ViewerCanvas /> */}
      </div>
    </div>
  );
};

export default Game;
