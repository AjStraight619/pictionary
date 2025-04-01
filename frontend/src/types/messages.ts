import { GameState, Word } from "./game";
import { Player } from "./lobby";

/**
 * Maps message types to their respective payload types.
 * This serves as a contract between the server and client for WebSocket messages.
 */
export interface MessagePayloadMap {
  // For receiving full game state
  gameState: GameState;

  // For requesting game state
  gameStateRequest: { playerID: string };

  revealedLetter: string;
  drawingPlayerChanged: Player;
  selectedWord: { word: Word; isSelectingWord: boolean };
  scoreUpdated: { playerID: string; score: number };
  playerReady: { playerID: string };
  playerToggleReady: { playerID: string };
  openSelectWordModal: { isSelectingWord: boolean; selectableWords: Word[] };
  startTimer: { timerType: string; duration: number };
  stopTimer: { timerType: string };
  startGame: { force?: boolean };
}

/**
 * Type for message handlers that process payloads with proper typing
 */
export type MessageHandler<K extends keyof MessagePayloadMap> = (
  payload: MessagePayloadMap[K]
) => void;

/**
 * Type for a map of message handlers with proper typing
 */
export type MessageHandlers = {
  [K in keyof MessagePayloadMap]?: MessageHandler<K>;
};
