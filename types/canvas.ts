import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { fabric } from 'fabric';
import { DrawingData, Position } from './drawing';
import { Point } from 'fabric/fabric-impl';
import { CustomFabricObject, DrawingData2 } from './shape';
import { CustomFabricObjectShape } from '@/lib/customFabricObjects';
import React from 'react';

export type InitializeFabric = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
};

export type CanvasMouseDown = {
  canvas: fabric.Canvas;
  options: fabric.IEvent;
  isDrawing: React.MutableRefObject<boolean>;
  selectedToolRef: React.MutableRefObject<Tool | null>;
  activeShapeRef: React.MutableRefObject<fabric.Object | null>;
  pathDataRef: React.MutableRefObject<Position[]>;
  isFillActiveRef: React.MutableRefObject<boolean>;
  lastUsedColorRef: React.MutableRefObject<string>;
  sendDrawingDataSVG: (id: string, svgData: string, shapeType?: string) => void;
};

export enum Tool {
  selector = 'selector',
  pencil = 'pencil',
  rect = 'rect',
  circle = 'circle',
  triangle = 'triangle',
}

export type CanvasMouseUp = {
  canvas: fabric.Canvas;
  isDrawing: React.MutableRefObject<boolean>;
  shapeRef: any;
  selectedToolRef: React.MutableRefObject<Tool | null>;
  setSelectedTool: (tool: Tool) => void;
};

export type CanvasMouseMove = {
  options: fabric.IEvent;
  canvas: fabric.Canvas;
  isDrawing: React.MutableRefObject<boolean>;
  selectedToolRef: React.MutableRefObject<Tool | null>;
  selectedShapeRef: React.MutableRefObject<fabric.Object | null>;
  pathDataRef: React.MutableRefObject<fabric.Point[]>;
  shapeRef: any;
  sendFreeHandData: (freeHandData: any) => void;
  selectedObjectsRef: React.MutableRefObject<fabric.Object[] | undefined>;
  lastUsedColorRef: React.MutableRefObject<string>;
  lastUsedStrokeWidthRef: React.MutableRefObject<number>;
  isMouseDownWithSelectionRef: React.MutableRefObject<boolean>;
};

export type CanvasPathCreated = {
  options: (fabric.IEvent & { path: CustomFabricObject<fabric.Path> }) | any;
  lastUsedColorRef: React.MutableRefObject<string>;
  sendDrawingDataSVG: (id: string, svgData: string, shapeType?: string) => void;
};

export type CanvasObjectsMoving = {
  options: fabric.IEvent;
  canvas: fabric.Canvas;
  sendDrawingData: (drawingData: DrawingData2) => void;
};

export type CanvasSelectionChange = {
  options: fabric.IEvent;
  selectedObjectsRef: React.MutableRefObject<
    CustomFabricObjectShape[] | undefined
  >;
};

export type CanvasMouseDownWithMultipleObjects = {
  selectedObjectsRef: React.MutableRefObject<fabric.Object[]>;
  mouseX: number;
  mouseY: number;
};

export type CanvasMultipleObjectsModified = {
  canvas: fabric.Canvas;
  options: fabric.IEvent;
  sendJsonMessage: SendJsonMessage;
};
