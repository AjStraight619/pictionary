import { Player } from "./lobby";

export type GameState = {
  id: string;
  players: Player[];
  rounds: Round[];
  currentWord: string | null;
};

export type Round = {
  number: number;
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
