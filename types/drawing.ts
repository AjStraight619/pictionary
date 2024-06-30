import { Tool } from "./canvas";
import { fabric } from "fabric";

export interface Position {
  x: number;
  y: number;
}

interface DrawingDataCommon {
  id: string;
  shapeType: "path" | "rect" | "circle" | "triangle" | "pencil";
}

export type UnifiedShapeData = DrawingDataCommon & {
  shapeData: fabric.Path | fabric.Rect | fabric.Circle | fabric.Triangle;
};

export interface CircleData extends DrawingDataCommon {
  type: Tool.circle;
  radius: number;
}

export interface TriangleData extends DrawingDataCommon {
  type: Tool.triangle;
  vertices: Position[];
}

export interface SquareData extends DrawingDataCommon {
  type: Tool.rect;
  width: number;
  height: number;
}

export interface PathData extends DrawingDataCommon {
  type: "path";
  path: fabric.Point[] | undefined;
}

export interface FreehandData extends DrawingDataCommon {
  type: Tool.pencil;
  path: fabric.Point[] | undefined;
}

export type DrawingData =
  | CircleData
  | TriangleData
  | SquareData
  | FreehandData
  | PathData;

export type UpdateShapeColor = {
  canvas: fabric.Canvas | null;
  lastUsedColor: string;
};

export type ModifyShape = {
  canvas: fabric.Canvas;
  property: string;
  value: any;
  activeObjectRef: React.MutableRefObject<fabric.Object | null>;
};
