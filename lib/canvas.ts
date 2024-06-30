import {
  CanvasMouseDown,
  CanvasMouseUp,
  InitializeFabric,
  Tool,
  CanvasPathCreated,
  CanvasMouseMove,
  CanvasSelectionChange,
  CanvasObjectsMoving,
} from "@/types/canvas";
import { Position } from "@/types/drawing";
import { fabric } from "fabric";
import { nanoid } from "nanoid";

import { CustomFabricObjectShapeType, DrawingData2 } from "@/types/shape";
import {
  CustomCircle,
  CustomFabricObjectShape,
  CustomPath,
  CustomRect,
  CustomTriangle,
} from "./customFabricObjects";
import { calculateNewPosition, storeInitialPositions } from "./utils";

export const initializeFabricCanvas = ({
  canvasRef,
  fabricRef,
}: InitializeFabric) => {
  const canvasElement = document.getElementById("canvas");
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
    if (selectedObject.type === "path") {
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
  const point = new fabric.Point(pointer.x, pointer.y);
  pathDataRef.current.push(position);
  let shapeId: string = "";
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
      canvas.freeDrawingBrush.color = "black";

      const pathString = `M${point.x},${point.y} L${point.x},${point.y}`;
      // const fabricPath = new CustomPath(pathString);
      // TODO: Adjust this so the user can simply draw dots on the screen, perhaps use a fabric circle and figure out how the strokeWidth matches when they continue drawing with pencil
      // const freehandData: DrawingData2 = {
      //   id: nanoid(),
      //   type: "path",
      //   shapeData: fabricPath,
      // };

      // sendDrawingData(freehandData);
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
    console.log("shape: ", shape);
    console.log("shape to object tosvg: ", shape.toSVG());

    sendDrawingDataSVG(shapeId, shape.toSVG());
  }

  if (
    target &&
    (target.type === activeShapeRef.current?.type ||
      target.type === "activeSelection")
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
  if (selectedToolRef.current === "pencil") {
    isDrawing.current = false;
    return;
  }

  shapeRef.current = "null";
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
  sendJsonMessage: any
) => {
  if (!obj) return;
  const svg = obj.toSVG();
  sendJsonMessage({
    type: "drawing",
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
  sendDrawingData,
  lastUsedColorRef,
  lastUsedStrokeWidthRef,
  selectedObjectsRef,
}: CanvasMouseMove) => {
  if (!selectedToolRef.current) return;

  // if (selectedObjectsRef.current && selectedObjectsRef.current.length > 1) {
  //   console.log("In bounding rect logic mouse move");
  //   selectedObjectsRef.current.forEach((obj) => {
  //     const objBoundingRect = obj.getBoundingRect();
  //     console.log("Object:", obj);
  //     console.log("Position:", {
  //       left: objBoundingRect.left,
  //       top: objBoundingRect.top,
  //     });
  //   });
  // }

  const pointer = canvas.getPointer(options.e);
  const point = new fabric.Point(pointer.x, pointer.y);

  if (selectedToolRef.current === Tool.pencil && isDrawing.current) {
    pathDataRef.current.push(point);
    canvas.freeDrawingBrush.color = lastUsedColorRef.current;
    canvas.freeDrawingBrush.width = lastUsedStrokeWidthRef.current;

    // Create the path string in SVG format
    const pathString = pathDataRef.current
      .map((p, index) => `${index === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");

    const fabricPath = new CustomPath(pathString);

    fabricPath.set({
      stroke: lastUsedColorRef.current,
      strokeWidth: lastUsedStrokeWidthRef.current,
    });

    const freehandData: DrawingData2 = {
      type: Tool.pencil,
      shapeData: fabricPath,
    };

    sendDrawingData(freehandData);
    return;
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

  sendDrawingDataSVG(pathId, path.toSVG(), "path");
};

export const handleCanvasObjectsMoving = ({
  options,
  canvas,
  sendDrawingData,
}: CanvasObjectsMoving) => {
  const activeSelection = options.target as CustomFabricObjectShape;
  console.log("active selection: ", activeSelection.toObject());
  const objects = canvas.getActiveObjects() as CustomFabricObjectShape[];
  if (!activeSelection) return;

  objects.forEach((obj) => {
    if (obj) {
      const newPosition = calculateNewPosition(obj, activeSelection);
      if (newPosition) {
        const { newLeft, newTop } = newPosition;
        console.log("New Position:", { newLeft, newTop });

        sendDrawingData({
          type: obj.type as CustomFabricObjectShapeType,
          id: obj.id,
          shapeData: { ...obj.toObject(), left: newLeft, top: newTop },
        });
      } else {
        console.error("Invalid new position calculated");
      }
    }
  });

  // const activeObject = options.target as CustomFabricObjectShape;

  // console.log("active object type: ", activeObject.type);

  // if (!activeObject) return;

  // const objects = canvas.getActiveObjects() as CustomFabricObjectShape[];
  // if (objects.length > 1 && activeObject.type === "activeSelection") {
  //   const activeObjectBoundingRect = activeObject.getBoundingRect();
  //   const deltaX = activeObjectBoundingRect.left - activeObject.left;
  //   const deltaY = activeObjectBoundingRect.top - activeObject.top;

  //   objects.forEach((obj) => {
  //     if (obj === activeObject) return; // Skip the active selection itself

  //     const newLeft = obj.left + deltaX;
  //     const newTop = obj.top + deltaY;

  //     console.log("Object:", obj);
  //     console.log("New Position:", {
  //       left: newLeft,
  //       top: newTop,
  //     });

  //     sendDrawingData({
  //       type: obj.type as CustomFabricObjectShapeType,
  //       id: obj.id,
  //       shapeData: { ...obj.toObject(), left: newLeft, top: newTop },
  //     });
  //   });

  // // If a single object is being moved
  // const objBoundingRect = activeObject.getBoundingRect();
  // console.log("Active Object Position:", {
  //   left: objBoundingRect.left,
  //   top: objBoundingRect.top,
  // });

  // sendDrawingData({
  //   type: activeObject.type as CustomFabricObjectShapeType,
  //   id: activeObject.id,
  //   shapeData: { ...activeObject.toObject() },
  // });
  // }
};

export const handleSelectionChange = ({
  options,
  selectedObjectsRef,
}: CanvasSelectionChange) => {
  selectedObjectsRef.current =
    (options.selected as unknown as CustomFabricObjectShape[]) || [];

  console.log("selection created: ", options.selected);
};

export const handleSelectionAndInitialPosition = (
  options: fabric.IEvent,
  selectedObjectsRef: React.MutableRefObject<
    CustomFabricObjectShape[] | undefined
  >
) => {
  // handleSelectionChange({
  //   options,
  //   selectedObjectsRef,
  // });

  storeInitialPositions(options.selected as CustomFabricObjectShape[]);
  console.log("options selected: ", options.selected);
  // console.log("options target: ", options.target);
  // // Also set initial position for active selection
  // console.log("options selected: ", options.selected);

  // if (options.selected && options.selected.length > 0) {
  //   options.selected.forEach((obj) => {
  //     const customObj = obj as CustomFabricObjectShape;
  //     console.log("Handling selection and initial position for:", customObj);
  //     if (customObj.setInitialPosition) {
  //       customObj.setInitialPosition();
  //     }
  //   });
  // }
};
