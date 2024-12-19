export type GameState = {
  id: string;
  players: Player[];
  rounds: RoundState[];
  currentWord: string | null;
  timers: GameTimers | null;
  status: GameStatus;
  maxRounds?: number;
  roundTime?: number;
  wordSelectTime?: number;
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
};

export type RoundState = {
  number: number;
  currentDrawer: Player;
};

export type TimerType = "game" | "round" | "idle";

export type GameTimers = {
  [key in TimerType]?: number;
};

export enum Guess {
  isCorrect = "isCorrect",
  isClose = "isClose",
  isWrong = "isWrong",
}
