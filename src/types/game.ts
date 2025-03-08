import { Player } from "./lobby";

export enum GameStatus {
  NotStarted = 0,
  InProgress = 1,
  Finished = 2,
}

export type GameState = {
  id: string;
  players: Player[];
  rounds: Round[];
  currentWord: string | null;
  currentRound: Round;
  status: GameStatus;
};

export type Round = {
  count: number;
  currentDrawer: Player;
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
