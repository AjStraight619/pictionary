import { GameState, Word } from "./game";
import { Player } from "./player";
import { DrawingDataType } from "./canvas";

export type MessagePayloadMap = {
  gameState: GameState;
  revealedLetter: string;
  drawingPlayerChanged: Player;
  selectedWord: { word: Word; isSelectingWord: boolean };
  openSelectWordModal: { isSelectingWord: boolean; selectableWords: Word[] };
  drawingData: {
    type: DrawingDataType;
    path: string;
    color: string;
    strokeWidth: number;
  };
  playerGuess: {
    username: string;
    guess: string;
    playerID: string;
  };
  startTimer: {
    timerType: string;
    duration: number;
  };
  stopTimer: {
    timerType: string;
  };
  startGame: {
    force?: boolean;
  };
  playerReady: {
    playerID: string;
  };
  playerToggleReady: {
    playerID: string;
  };
};

export type MessageHandlers = {
  [K in keyof MessagePayloadMap]: (payload: MessagePayloadMap[K]) => void;
};
