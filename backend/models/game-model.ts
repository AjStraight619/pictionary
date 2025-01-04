import { SelectableWord } from "./../types/word.ts";

export type GameState = {
  id: string;
  players: Player[];
  rounds: RoundState[];
  currentWord: string | null;
  timers: GameTimers | null;
  status: GameStatus;
  maxRounds: number;
  roundTime: number;
  wordSelectTime: number;
};

export type GameStatus = "initial" | "started" | "finished";

export type Player = {
  id: string;
  name: string;
  score: number;
  socket: WebSocket | null;
  color: string;
  isLeader: boolean;
  isDrawing: boolean;
  guess?: Guess;
  disconnected: boolean; // New: Tracks if the player is disconnected
  reconnectionTimeoutId?: number; // New: Timeout ID for cleanup
};

export type RoundState = {
  round: number;
  currentDrawer: Player;
  words: SelectableWord[];
};

export type TimerType = "game" | "word-select" | "round" | "idle" | "cleanup";

export type GameTimers = {
  [key in TimerType]?: number;
};

export enum Guess {
  isCorrect = "isCorrect",
  isClose = "isClose",
  isWrong = "isWrong",
}
