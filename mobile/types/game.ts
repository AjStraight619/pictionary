import { Player } from "./player";

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
  maxPlayers: number;
};

export type GameState = {
  id: string;
  players: Player[];
  playerOrder: string[];
  options: GameOptions;
  status: GameStatus;
  round: Round | null;
  turn: Turn | null;
  revealedLetters: string[];
  selectableWords: Word[];
  isSelectingWord: boolean;
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
