import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import {
  CanvasMouseDown,
  CanvasMouseUp,
  InitializeFabric,
  Tool,
  CanvasPathCreated,
  CanvasMouseMove,
  CanvasSelectionChange,
  CanvasObjectsMoving,
  CanvasMouseDownWithMultipleObjects,
  CanvasMultipleObjectsModified,
} from '@/types/canvas';
import { FreeHandDrawingData, Position } from '@/types/drawing';
import { fabric } from 'fabric';
import { nanoid } from 'nanoid';

import { CustomFabricObjectShapeType } from '@/types/shape';
import {
  CustomCircle,
  CustomFabricObjectShape,
  CustomRect,
  CustomTriangle,
} from './customFabricObjects';
import {
  calculateNewPosition,
  compressMessage,
  storeInitialPositions,
} from './utils';
import { Point } from 'fabric/fabric-impl';

export const initializeFabricCanvas = ({
  canvasRef,
  fabricRef,
}: InitializeFabric) => {
  const canvasElement = document.getElementById('canvas');
  const canvas = new fabric.Canvas(canvasRef.current, {
    width: canvasElement?.clientWidth,
    height: canvasElement?.clientHeight,
  });

  fabricRef.current = canvas;

  return canvas;
};

export const handleCanvasMouseDown = ({
  canvas,
  options,
  isDrawing,
  selectedToolRef,
  sendDrawingDataSVG,
  pathDataRef,
  activeShapeRef,
  isFillActiveRef,
  lastUsedColorRef,
}: CanvasMouseDown) => {
  if (isFillActiveRef.current && options.target) {
    const selectedObject = options.target as any;
    if (selectedObject.type === 'path') {
      selectedObject.set({
        stroke: lastUsedColorRef.current,
      });
    } else {
      selectedObject.set({
        fill: lastUsedColorRef.current,
      });
    }

    sendDrawingDataSVG(selectedObject.id, selectedObject.toSVG());
    return;
  }
  const pointer = canvas.getPointer(options.e) as Position;
  if (!pointer) return;

  const position = { x: pointer.x, y: pointer.y };
  const target = canvas.findTarget(options.e, false);
  pathDataRef.current.push(position);
  let shapeId: string = '';
  if (selectedToolRef.current !== Tool.selector) {
    shapeId = nanoid();
  }

  const shapeType = selectedToolRef.current;

  let shape: CustomFabricObjectShape | null = null;

  switch (shapeType) {
    case Tool.selector:
      isDrawing.current = false;
      canvas.isDrawingMode = false;
      break;

    case Tool.pencil:
      isDrawing.current = true;
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = 5;
      canvas.freeDrawingBrush.color = lastUsedColorRef.current;
      return;

    case Tool.circle:
      shape = new CustomCircle({
        left: position.x,
        top: position.y,
        radius: 50,
        fill: lastUsedColorRef.current,
        id: shapeId,
      });
      break;

    case Tool.triangle:
      shape = new CustomTriangle({
        left: position.x,
        top: position.y,
        width: 100,
        height: 100,
        fill: lastUsedColorRef.current,
        id: shapeId,
      });
      break;

    case Tool.rect:
      shape = new CustomRect({
        left: position.x,
        top: position.y,
        width: 100,
        height: 100,
        fill: lastUsedColorRef.current,
        id: shapeId,
      } as any);
      break;

    default:
      break;
  }

  if (shape) {
    activeShapeRef.current = shape;
    canvas.add(shape);
    console.log('shape: ', shape);
    console.log('shape object to svg: ', shape.toSVG());

    sendDrawingDataSVG(shapeId, shape.toSVG());
  }

  if (
    target &&
    (target.type === activeShapeRef.current?.type ||
      target.type === 'activeSelection')
  ) {
    isDrawing.current = false;
    canvas.setActiveObject(target);
    target.setCoords();
  }
};

export const handleCanvasMouseUp = ({
  canvas,
  isDrawing,
  shapeRef,
  selectedToolRef,
  setSelectedTool,
}: CanvasMouseUp) => {
  if (selectedToolRef.current === 'pencil') {
    isDrawing.current = false;
    return;
  }

  shapeRef.current = 'null';
  selectedToolRef.current = null;

  // If the canvas is not in drawing mode, set the active element to default after 700ms
  if (!canvas.isDrawingMode) {
    setTimeout(() => {
      setSelectedTool(Tool.selector);
    }, 700);
  }
};

export const handleObjectChange = (
  obj: CustomFabricObjectShape,
  sendJsonMessage: any,
) => {
  if (!obj) return;
  const svg = obj.toSVG();
  sendJsonMessage({
    type: 'drawing',
    data: {
      id: obj.id,
      svg,
    },
  });
};

export const handleCanvasMouseMove = ({
  options,
  canvas,
  isDrawing,
  selectedToolRef,
  pathDataRef,
  sendFreeHandData,
  lastUsedColorRef,
  lastUsedStrokeWidthRef,
  selectedObjectsRef,
  isMouseDownWithSelectionRef,
}: CanvasMouseMove) => {
  if (!selectedToolRef.current) return;
  if (
    isMouseDownWithSelectionRef.current &&
    selectedObjectsRef.current &&
    selectedObjectsRef.current.length > 1
  ) {
    const pointer = options.pointer;

    if (!canvas || !pointer) return;

    const boundingRect = canvas.getActiveObject()?.getBoundingRect();
    if (boundingRect) {
      const isPointerInBounds =
        pointer.x >= boundingRect.left &&
        pointer.x <= boundingRect.left + boundingRect.width &&
        pointer.y >= boundingRect.top &&
        pointer.y <= boundingRect.top + boundingRect.height;

      if (isPointerInBounds) {
        console.log('Pointer is in bounds...');
      } else {
        console.log('Pointer is out of bounds...');
        return;
      }
    }
  }

  const distanceThreshold = 5;

  // Utility function to calculate distance between two points
  const calculateDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  if (selectedToolRef.current === Tool.pencil && isDrawing.current) {
    const lastPoint = pathDataRef.current[pathDataRef.current.length - 1];
    const pointer = canvas.getPointer(options.e);
    const point = new fabric.Point(pointer.x, pointer.y);
    if (!lastPoint || calculateDistance(lastPoint, point) > distanceThreshold) {
      pathDataRef.current.push(point);
      canvas.freeDrawingBrush.color = lastUsedColorRef.current;
      canvas.freeDrawingBrush.width = lastUsedStrokeWidthRef.current;

      // Create the path string in SVG format
      const pathString = pathDataRef.current
        .map((p, index) => `${index === 0 ? 'M' : 'L'}${p.x},${p.y}`)
        .join(' ');

      // Create the freehand drawing data object
      const freeHandData: FreeHandDrawingData = {
        type: Tool.pencil,
        stroke: lastUsedColorRef.current,
        strokeWidth: lastUsedStrokeWidthRef.current,
        path: compressMessage(pathString),
      };
      sendFreeHandData(freeHandData);
    }
  }
};

export const handlePathCreated = ({
  options,
  sendDrawingDataSVG,
  lastUsedColorRef,
}: CanvasPathCreated) => {
  const path = options.path;
  if (!path) return;
  const pathId = nanoid();
  path.set({
    id: pathId,
    stroke: lastUsedColorRef.current,
  });

  sendDrawingDataSVG(pathId, path.toSVG(), 'path');
};

export const handleCanvasObjectsMoving = ({
  options,
  canvas,
  sendDrawingData,
}: CanvasObjectsMoving) => {
  const activeSelection = options.target as CustomFabricObjectShape;
  console.log('active selection: ', activeSelection.toObject());
  const objects = canvas.getActiveObjects() as CustomFabricObjectShape[];
  if (!activeSelection) return;

  objects.forEach(obj => {
    if (obj) {
      const newPosition = calculateNewPosition(obj, activeSelection);
      if (newPosition) {
        const { newLeft, newTop } = newPosition;
        sendDrawingData({
          type: obj.type as CustomFabricObjectShapeType,
          id: obj.id,
          shapeData: { ...obj.toObject(), left: newLeft, top: newTop },
        });
      } else {
        console.error('Invalid new position calculated');
      }
    }
  });
};

export const handleSelectionChange = ({
  options,
  selectedObjectsRef,
}: CanvasSelectionChange) => {
  selectedObjectsRef.current =
    (options.selected as unknown as CustomFabricObjectShape[]) || [];

  console.log('selection created: ', options.selected);
};

export const handleSelectionAndInitialPosition = (
  options: fabric.IEvent,
  selectedObjectsRef: React.MutableRefObject<
    CustomFabricObjectShape[] | undefined
  >,
) => {
  storeInitialPositions(options.selected as CustomFabricObjectShape[]);
  console.log('options selected: ', options.selected);
};

export const handleMultipleObjectsMoving = ({
  canvas,
  options,
  sendJsonMessage,
}: CanvasMultipleObjectsModified) => {
  const activeSelection = canvas.getActiveObject();

  if (activeSelection && activeSelection.type === 'activeSelection') {
    const objects = (activeSelection as fabric.ActiveSelection).getObjects();

    // Log the objects before discarding the active selection
    // console.log(
    //   'Objects before discard:',
    //   objects.map(obj => ({ left: obj.left, top: obj.top })),
    // );

    // Dissolve the active selection back into individual objects
    canvas.discardActiveObject();

    // After discarding the active selection, the objects should now reflect their true positions
    // objects.forEach((obj, idx) => {
    //   const left = obj.left;
    //   const top = obj.top;
    //   console.log(
    //     `Object ${idx} new position after drop: left = ${left}, top = ${top}`,
    //   );
    // });

    objects.forEach(obj => {
      handleObjectChange(obj as CustomFabricObjectShape, sendJsonMessage);
    });

    // canvas.renderAll();
  }
};
