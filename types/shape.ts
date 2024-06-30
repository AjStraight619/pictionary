import {
  CustomCircle,
  CustomPath,
  CustomRect,
  CustomTriangle,
} from "@/lib/customFabricObjects";
import { fabric } from "fabric";
export type ShapeData = {
  type: "rectangle" | "circle" | "triangle" | "path" | "pencil";
  data: fabric.Object | null;
};

export type DrawingData2 = {
  id?: string;
  type: "path" | "rect" | "circle" | "triangle" | "pencil";
  shapeData: CustomRect | CustomPath | CustomCircle | CustomTriangle;
};

export interface CustomFabricObject<T extends fabric.Object>
  extends fabric.Object {
  id?: string;
}

export type CustomFabricObjectShapeType =
  | "path"
  | "rect"
  | "circle"
  | "triangle"
  | "pencil";
