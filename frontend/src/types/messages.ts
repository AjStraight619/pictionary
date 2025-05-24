import { ChatMessage, Cursor, GameState, Player, Word } from "./game";
import { ShapeData } from "./canvas";

/**
 * Maps message types to their respective payload types.
 * This serves as a contract between the server and client for WebSocket messages.
 */
export type MessagePayloadMap = {
  // For receiving full game state
  gameState: GameState;

  // For requesting game state
  gameStateRequest: { playerID: string };

  // Drawing-related messages
  drawing: {
    coordinates: [number, number][];
    color: string;
    strokeWidth: number;
  };
  shape: ShapeData;
  canvas: { id: string; data: string };
  "remove-all": null;
  "remove-element": { id: string };
  drawingData: {
    type: string;
    path?: string;
    color: string;
    strokeWidth: number;
    coordinates?: [number, number][];
  };

  // Player interactions
  playerGuess: ChatMessage;
  playerReady: { playerID: string };
  playerToggleReady: { playerID: string };
  playerJoined: { player: Player };
  playerLeft: { player: Player };
  playerRemoved: { player: Player };
  removePlayer: { playerID: string; hostID: string };
  letterRevealed: LetterRevealPayload;
  // Game flow messages
  revealedLetters: { letters: string[] };
  drawingPlayerChanged: Player;
  selectedWord: { word: Word; isSelectingWord: boolean };
  scoreUpdated: { playerID: string; score: number };
  openSelectWordModal: { isSelectingWord: boolean; selectableWords: Word[] };
  closeSelectWordModal: null;

  // Timer messages
  startTimer: { timerType: string; duration: number };
  stopTimer: { timerType: string };
  startGameCountdown: { duration: number };
  cursorUpdate: { playerID: string; cursor: Cursor | null };

  // Game control messages
  startGame: { force?: boolean };

  // Add these timer-related message types
  selectWordTimer: { timeRemaining?: number };
  turnTimer: { timeRemaining?: number };

  toast: ToastEvent;
};

export enum ToastEventTypes {
  PlayerJoined = "player-joined",
  PlayerLeft = "player-left",
  PlayerRemoved = "player-removed",
}
export type ToastEvent = {
  type: ToastEventTypes;
  message: string;
};

export type LetterRevealPayload = {
  position: number;
  letter: string;
};

export type MessageHandler<K extends keyof MessagePayloadMap> = (
  payload: MessagePayloadMap[K]
) => void;

export type MessageHandlers = {
  [K in keyof MessagePayloadMap]?: MessageHandler<K>;
};
