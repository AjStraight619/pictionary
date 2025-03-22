import { GameState, Word } from "@/types/game";
import { Player } from "@/types/lobby";

export type MessagePayloadMap = {
  gameState: GameState;
  revealedLetter: string;
  drawingPlayerChanged: Player;
  selectedWord: { word: Word; isSelectingWord: boolean };
  openSelectWordModal: { isSelectingWord: boolean; selectableWords: Word[] };
};

export type MessageHandlers = {
  [K in keyof MessagePayloadMap]: (payload: MessagePayloadMap[K]) => void;
};
