import CanvasComponent from '@/components/game/canvas/canvas';
import { SVGCanvas } from '@/components/game/canvas/svg-canvas';
import Chat from '@/components/game/chat/chat';
import Lobby from '@/components/game/lobby/lobby';
import WordSelect from '@/components/game/word/word-select';

const Game = () => {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      {/* <WordFetcher /> */}
      <div className="flex flex-row items-center gap-x-2">
        <WordSelect />
        {/* <Timer
          timerType="round"
          messageTypes={['round-timer-update', 'round-timer-end']}
        /> */}
      </div>
      <div className="flex flex-row items-center justify-center w-full container gap-x-4">
        <Lobby />
        <Chat />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <CanvasComponent />
        <SVGCanvas />
      </div>
    </div>
  );
};

export default Game;
