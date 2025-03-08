import Canvas from "@/components/game/canvas/canvas";
import Chat from "@/components/game/chat/chat";
import Lobby from "@/components/game/lobby/lobby";
import PreGameLobby from "@/components/game/lobby/pre-game-lobby";
import WordToGuess from "@/components/game/word/word";
import WordSelect from "@/components/game/word/word-select";
import { GameProvider } from "@/providers/game-provider";

const Game = () => {
  return (
    <GameProvider>
      <div className="flex flex-col min-h-screen items-center justify-between p-12">
        <div className="flex flex-row items-stretch justify-center w-full container gap-x-4 min-h-[12rem] max-h-[12rem]">
          <PreGameLobby />
          <WordSelect />
          <div className="hidden md:block w-full">
            <Lobby />
          </div>
          <div className="hidden md:block h-full">
            <Chat />
          </div>
        </div>
        <WordToGuess />
        <Canvas />
      </div>
    </GameProvider>
  );
};

export default Game;
