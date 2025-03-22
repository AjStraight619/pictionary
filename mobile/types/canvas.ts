export enum SelectedTool {
  Selector = "Selector",
  Pencil = "Pencil",
  Line = "Line",
  Rectangle = "Rectangle",
  Circle = "Circle",
  Triangle = "Triangle",
  Eraser = "Eraser",
  Text = "Text",
}

export type ShapeType = "rectangle" | "circle" | "triangle" | "path";

export type DrawingDataType = "pencil" | "rectangle" | "circle" | "triangle";

export type DrawingData = {
  type: DrawingDataType;
  coordinates: [number, number][];
  color: string;
  strokeWidth: number;
};
