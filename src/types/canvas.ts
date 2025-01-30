export enum SelectedTool {
  Selector = 'Selector',
  Pencil = 'Pencil',
  Line = 'Line',
  Rectangle = 'Rectangle',
  Circle = 'Circle',
  Triangle = 'Triangle',
  Eraser = 'Eraser',
  Text = 'Text',
}

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'path';

export type ShapeData = {
  id: string;
  type?: ShapeType;
  svg: string | Uint8Array<ArrayBufferLike>;
};
