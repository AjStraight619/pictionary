export enum GameStatus {
  NotStarted = 0,
  InProgress = 1,
  Finished = 2,
}

export enum TurnPhase {
  PhaseWordSelection = 0,
  PhaseDrawing = 1,
}

export type GameOptions = {
  turnTimeLimit: number;
  selectWordTimeLimit: number;
  roundLimit: number;
};

export type GameState = {
  id: string;
  players: Player[];
  playerOrder: string[];
  options: GameOptions;
  status: GameStatus;
  activeCursor: Cursor | null;
  round: Round | null;
  turn: Turn | null;
  revealedLetters: string[];
  selectableWords: Word[];
  isSelectingWord: boolean;
};

export type Player = {
  ID: string;
  username: string;
  isDrawing: boolean;
  isGuessCorrect: boolean;
  isHost: boolean;
  score: number;
  color: string;
  ready: boolean;
};

export type Cursor = {
  x: number;
  y: number;
  color: string;
};

export type Word = {
  id: string;
  word: string;
  category: string;
};

export type Round = {
  count: number;
  currentDrawer: Player;
  currentDrawerID: string;
};

export type Turn = {
  wordToGuess: Word | null;
  revealedLetters: string[];
  playersGuessedCorrectly?: Map<string, boolean>;
  phase: TurnPhase;
};

type DrawingDataType = "pencil" | "rectangle" | "circle" | "triangle";

export type DrawingData = {
  type: DrawingDataType;
  coordinates: [number, number][];
  color: string;
  strokeWidth: number;
};

export type FreeHandData = {
  type: DrawingDataType;
  stroke: string;
  strokeWidth: number;
  path: string;
};

export type ShapeData = {
  type: DrawingDataType;
  id: string;
};
