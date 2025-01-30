import { SelectedTool, ShapeData } from "@/types/canvas";
import { FreeHandData } from "@/types/game";
import * as fabric from "fabric";
import React, { SetStateAction } from "react";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import pako from "pako";

export type ShapeType = "rectangle" | "circle" | "triangle";

// Distance threshold between viewport points when drawing to reduce excessive point calculations
const DISTANCE_THRESHOLD = 8;

export const initializeCanvas = ({
  canvasRef,
  fabricRef,
  id,
}: {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
  id: string;
}) => {
  if (!canvasRef.current) return;
  const canvasElement = document.getElementById(id);

  const canvas = new fabric.Canvas(canvasRef.current, {
    width: canvasElement?.clientWidth,
    height: canvasElement?.clientHeight,
  });

  fabricRef.current = canvas;

  return canvas;
};

const onSelectorDown = () => {};

const onPencilDown = (
  canvas: fabric.Canvas,
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>,
  isMouseDownRef: React.MutableRefObject<boolean>,
  pathDataRef: React.MutableRefObject<fabric.Point[]>,
) => {
  canvas.isDrawingMode = true;
  isMouseDownRef.current = true;
  const { x, y } = options.viewportPoint;
  const point = new fabric.Point(x, y);

  pathDataRef.current.push(point);
};
// TODO: Somehow implement eraser

const addShapeToCanvas = (
  canvas: fabric.Canvas,
  shape: fabric.FabricObject | null,
  shapeId: string,
  shapeType: ShapeType,
  sendSvgShape: (shapeData: ShapeData) => void,
) => {
  if (!shape) return;
  canvas.add(shape);
  canvas.renderAll();
  const svgShape = shape.toSVG();

  const shapeData: ShapeData = {
    id: shapeId,
    type: shapeType,
    svg: svgShape,
  };
  sendSvgShape(shapeData);
};

const onShapeDown = (
  shapeType: ShapeType,
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>,
  canvas: fabric.Canvas,
  sendSvgShape: (shapeData: ShapeData) => void,
  lastUsedColorRef: React.MutableRefObject<string>,
) => {
  const pointer = canvas.getViewportPoint(options.e);
  const shapeId = crypto.randomUUID();
  let shape: fabric.FabricObject | null = null;

  switch (shapeType) {
    case "rectangle":
      shape = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        width: 100,
        height: 100,
        fill: lastUsedColorRef.current,
      });

      shape.set({
        id: shapeId,
      });

      break;

    case "triangle":
      shape = new fabric.Triangle({
        left: pointer.x,
        top: pointer.y,
        height: 100,
        width: 100,
        fill: lastUsedColorRef.current,
      });

      shape.set({
        id: shapeId,
      });
      break;

    case "circle":
      shape = new fabric.Circle({
        left: pointer.x,
        top: pointer.y,
        radius: 50,
        fill: lastUsedColorRef.current,
      });

      shape.set({
        id: shapeId,
      });
      break;

    default:
      console.log("Something went wrong when placing shape on canvas");
  }

  addShapeToCanvas(canvas, shape, shapeId, shapeType, sendSvgShape);
};

export const handleCanvasMouseDown = ({
  options,
  selectedToolRef,
  canvas,
  sendSvgShape,
  isMouseDownRef,
  pathDataRef,
  lastUsedColorRef,
  lastUsedBrushSizeRef,
}: {
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>;
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas;
  sendDrawingData: (drawingData: FreeHandData) => void;
  sendSvgShape: (shapeData: ShapeData) => void;
  isMouseDownRef: React.MutableRefObject<boolean>;
  pathDataRef: React.MutableRefObject<fabric.Point[]>;
  lastUsedColorRef: React.MutableRefObject<string>;
  lastUsedBrushSizeRef: React.MutableRefObject<number>;
}) => {
  canvas.isDrawingMode = false;

  switch (selectedToolRef.current) {
    case SelectedTool.Selector:
      onSelectorDown();
      break;
    case SelectedTool.Pencil:
      onPencilDown(
        canvas,
        options,

        isMouseDownRef,
        pathDataRef,
      );
      break;

    case SelectedTool.Eraser:
      //onEraserDown(options, canvas);
      break;

    case SelectedTool.Rectangle:
      onShapeDown("rectangle", options, canvas, sendSvgShape, lastUsedColorRef);
      break;

    case SelectedTool.Triangle:
      onShapeDown("triangle", options, canvas, sendSvgShape, lastUsedColorRef);
      break;

    case SelectedTool.Circle:
      onShapeDown("circle", options, canvas, sendSvgShape, lastUsedColorRef);
      break;

    default:
      console.warn("Something went wrong");
  }
};

export const handleMouseUp = ({
  isMouseDownRef,
  pathDataRef,
  selectedToolRef,
  canvas,
  setSelectedTool,
}: {
  isMouseDownRef: React.MutableRefObject<boolean>;
  pathDataRef: React.MutableRefObject<fabric.Point[]>;
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas;
  setSelectedTool: React.Dispatch<SetStateAction<SelectedTool>>;
}) => {
  isMouseDownRef.current = false;
  pathDataRef.current = [];

  setTimeout(() => {
    if (selectedToolRef.current !== SelectedTool.Pencil) {
      canvas.selection = true;
      selectedToolRef.current = SelectedTool.Selector;
      setSelectedTool(SelectedTool.Selector);
    }
  }, 200);
};
export const handleObjectModified = ({
  canvas,
  sendSvgShape,
}: {
  canvas: fabric.Canvas;
  sendSvgShape: (shapeData: ShapeData) => void;
}) => {
  const objects = canvas.getActiveObjects();
  objects.forEach((obj) => {
    // @ts-expect-error do not want to extend types for now
    const id = obj.id;
    let svgShape = obj.toSVG();

    // Calculate absolute transform matrix.
    const absoluteMatrix = obj.calcTransformMatrix();
    const [a, b, c, d, e, f] = absoluteMatrix;

    // Construct the absolute transform attribute.
    const absoluteTransform = `transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})"`;

    // Replace the object's transform in the SVG with our computed absolute transform.
    svgShape = svgShape.replace(
      /transform="matrix\([^)]+\)"/,
      absoluteTransform,
    );

    const shapeData = { id, svg: svgShape };
    sendSvgShape(shapeData);
  });
};

export const handleCanvasMouseMove = ({
  options,
  selectedToolRef,
  canvas,
  sendDrawingData,
  isMouseDownRef,
  pathDataRef,
  lastUsedColorRef,
  lastUsedBrushSizeRef,
}: {
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>;
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas;
  sendDrawingData: (drawingData: FreeHandData) => void;
  isMouseDownRef: React.MutableRefObject<boolean>;
  pathDataRef: React.MutableRefObject<fabric.Point[]>;
  lastUsedColorRef: React.MutableRefObject<string>;
  lastUsedBrushSizeRef: React.MutableRefObject<number>;
}) => {
  const { x, y } = options.viewportPoint;

  if (selectedToolRef.current !== SelectedTool.Selector) {
    canvas.selection = false;
  }

  if (
    selectedToolRef.current === SelectedTool.Pencil &&
    isMouseDownRef.current === true
  ) {
    const point = new fabric.Point(x, y);

    // Utility function to calculate distance between two points
    const calculateDistance = (p1: fabric.Point, p2: fabric.Point): number => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    // Check the last point in the path and ensure distance is significant
    const lastPoint = pathDataRef.current[pathDataRef.current.length - 1];
    if (
      !lastPoint ||
      calculateDistance(lastPoint, point) >= DISTANCE_THRESHOLD
    ) {
      pathDataRef.current.push(point);
      // Generate the SVG path string

      const pathString = pathDataRef.current
        .map((p, index) => `${index === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");

      // Send the path data to the WebSocket
      const freeHandData: FreeHandData = {
        type: "pencil",
        stroke: lastUsedColorRef.current,
        strokeWidth: lastUsedBrushSizeRef.current,
        path: pathString,
      };

      sendDrawingData(freeHandData);
    }
  }
};

export const handlePathCreated = ({
  path,
  sendSvgShape,
}: {
  path: fabric.FabricObject;
  sendSvgShape: (shapeData: ShapeData) => void;
}) => {
  const pathId = crypto.randomUUID();

  path.set({
    id: pathId,
  });

  const svgPath = path.toSVG();

  const compressedPath = pako.deflate(svgPath);

  const svgData: ShapeData = {
    id: pathId,
    type: "path",
    svg: compressedPath,
  };
  sendSvgShape(svgData);
};

export const handleKeyDownEvents = ({
  e,
  canvas,
  historyIndexRef,
  canvasHistoryRef,
  sendJsonMessage,
}: {
  e: KeyboardEvent;
  canvas: fabric.Canvas | null;
  historyIndexRef: React.MutableRefObject<number>;
  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>;
  sendJsonMessage: SendJsonMessage;
}) => {
  // Validate the canvas instance and its `contextTop`
  if (!canvas) {
    console.warn("Canvas is not ready");
    return;
  }

  // Handle delete and backspace keys for object removal
  if (e.key === "Delete" || e.key === "Backspace") {
    const activeObjects = canvas.getActiveObjects();
    const allObjects = canvas.getObjects();

    if (activeObjects.length === allObjects.length) {
      // Clear entire canvas
      canvas.clear();
      canvas.renderAll(); // Ensure immediate re-render
      sendJsonMessage({
        type: "remove-all",
      });
    } else {
      activeObjects.forEach((object) => {
        // Ensure object has an ID before removing
        const id = (object as fabric.Object & { id?: string }).id;
        console.log("Object id to be deleted: ", id);
        canvas.remove(object);
        canvas.discardActiveObject(); // Clear selection
        canvas.renderAll(); // Ensure canvas updates immediately

        // Send removal event to WebSocket
        sendJsonMessage({
          type: "remove-element",
          payload: { id },
        });
      });
    }
  }
};

//const saveHistory = (
//  canvas: fabric.Canvas,
//  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>,
//  historyIndexRef: React.MutableRefObject<number>,
//) => {
//  const serializedObjects = canvas
//    .getObjects()
//    .map((obj) => obj.toObject(["id", "customProperty"]));
//
//  // Trim future history if we overwrite it
//  if (historyIndexRef.current < canvasHistoryRef.current.length - 1) {
//    canvasHistoryRef.current = canvasHistoryRef.current.slice(
//      0,
//      historyIndexRef.current + 1,
//    );
//  }
//
//  canvasHistoryRef.current.push(serializedObjects);
//  historyIndexRef.current++;
//  console.log("History saved:", canvasHistoryRef.current);
//};

//export const undo = (
//  canvas: fabric.Canvas,
//  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>,
//  historyIndexRef: React.MutableRefObject<number>,
//) => {
//  if (historyIndexRef.current > 0) {
//    historyIndexRef.current--;
//    const previousState = canvasHistoryRef.current[historyIndexRef.current];
//    restoreCanvasState(canvas, previousState);
//  } else {
//    console.log("No more undo steps.");
//  }
//};
//
//export const redo = (
//  canvas: fabric.Canvas,
//  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>,
//  historyIndexRef: React.MutableRefObject<number>,
//) => {
//  if (historyIndexRef.current < canvasHistoryRef.current.length - 1) {
//    historyIndexRef.current++;
//    const nextState = canvasHistoryRef.current[historyIndexRef.current];
//    restoreCanvasState(canvas, nextState);
//  } else {
//    console.log("No more redo steps.");
//  }
//};
//
//const restoreCanvasState = (
//  canvas: fabric.Canvas,
//  state: fabric.FabricObject[],
//) => {
//  console.log("Restoring canvas state:", state);
//
//  // Clear the canvas
//  canvas.clear();
//
//  // Enliven objects and add them to the canvas
//  fabric.util.enlivenObjects(state, (objects) => {
//    if (objects.length === 0) {
//      console.error("No objects to restore");
//    }
//    objects.forEach((obj) => {
//      console.log("Adding object to canvas:", obj);
//      canvas.add(obj);
//    });
//
//    // Render the canvas after adding objects
//    canvas.renderAll();
//  });
//};
