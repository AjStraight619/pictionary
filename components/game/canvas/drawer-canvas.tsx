"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import {
  initializeFabricCanvas,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handlePathCreated,
  handleCanvasMouseMove,
  handleSelectionAndInitialPosition,
  handleObjectChange,
} from "@/lib/canvas";
import Toolbar from "../toolbar";
import { Tool } from "@/types/canvas";
import { useThrottledCallback } from "use-debounce";
import { DrawingData } from "@/types/drawing";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { DrawingData2 } from "@/types/shape";
import { CustomFabricObjectShape } from "@/lib/customFabricObjects";
import { IEvent } from "fabric/fabric-impl";
import { handleKeyDown } from "@/lib/keyevents";

type State = DrawingData[];
type Action =
  | { type: "add"; payload: DrawingData }
  | { type: "update"; payload: DrawingData }
  | { type: "remove"; payload: { id: string } };

type CanvasProps = {
  userId: string;
  roomId: string;
};

export default function DrawerCanvas({ userId, roomId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const selectedToolRef = useRef<Tool | null>(Tool.selector);
  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.selector);
  const activeShapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<fabric.Object | null>(null);
  const pathDataRef = useRef<fabric.Point[]>([]);
  const selectedObjectsRef = useRef<CustomFabricObjectShape[] | undefined>([]);
  const lastUsedColorRef = useRef<string>("#000000");
  const lastUsedStrokeWidthRef = useRef<number>(5);
  const isFillActiveRef = useRef<boolean>(false);

  const { sendJsonMessage } = useCustomWebSocket({ roomId, userId });
  const renderRef = useRef(0);

  const sendDrawingData = useThrottledCallback((drawingData: DrawingData2) => {
    sendJsonMessage({ type: "drawing", data: drawingData });
  }, 25);

  const sendDrawingDataSVG = useThrottledCallback(
    (id: string, svgData: string, shapeType?: string) => {
      sendJsonMessage({
        type: "drawing",
        data: { id, shapeType, svg: svgData },
      });
    },
    16
  );

  const handleSelectedToolChange = useCallback((tool: Tool) => {
    if (!fabricRef.current) return;
    setSelectedTool(tool);
    selectedToolRef.current = tool;

    if (tool !== Tool.pencil) {
      fabricRef.current.isDrawingMode = false;
      fabricRef.current.hoverCursor = "default";
      fabricRef.current.defaultCursor = "default";
    }

    switch (tool) {
      case Tool.selector:
        fabricRef.current.isDrawingMode = false;
        fabricRef.current.hoverCursor = "default";
        fabricRef.current.defaultCursor = "default";
        break;
      case Tool.pencil:
        fabricRef.current.isDrawingMode = true;
        fabricRef.current.hoverCursor = "crosshair";
        fabricRef.current.defaultCursor = "crosshair";
        fabricRef.current.freeDrawingBrush.width =
          lastUsedStrokeWidthRef.current;
        fabricRef.current.freeDrawingBrush.color = lastUsedColorRef.current;
        break;
      default:
        fabricRef.current.isDrawingMode = false;
        fabricRef.current.hoverCursor = "default";
        fabricRef.current.defaultCursor = "default";

        break;
    }
  }, []);

  useEffect(() => {
    const canvas = initializeFabricCanvas({
      canvasRef,
      fabricRef,
    });

    const eventHandler = (options: IEvent) => {
      const obj = options.target as CustomFabricObjectShape;

      handleObjectChange(obj, sendJsonMessage);
    };

    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        canvas,
        options,
        isDrawing,
        selectedToolRef,
        pathDataRef,
        activeShapeRef,
        isFillActiveRef,
        sendDrawingDataSVG,
        lastUsedColorRef,
      });
    });

    canvas.on("path:created", (options) => {
      handlePathCreated({
        options,
        lastUsedColorRef,
        sendDrawingDataSVG,
      });
    });

    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef: activeShapeRef,
        selectedToolRef,
        setSelectedTool,
      });
      pathDataRef.current = [];
    });

    canvas.on("mouse:move", (options) => {
      handleCanvasMouseMove({
        canvas,
        options,
        isDrawing,
        shapeRef: activeShapeRef,
        selectedToolRef,
        pathDataRef,
        selectedShapeRef,
        lastUsedColorRef,
        selectedObjectsRef,
        sendDrawingData,
        lastUsedStrokeWidthRef,
      });
    });

    canvas.on("object:modified", (options) => {
      eventHandler(options);
    });
    canvas.on("object:moving", eventHandler);
    canvas.on("object:rotating", eventHandler);

    canvas.on("selection:created", (options) => {
      console.log("Selection created: ", options.selected);
      handleSelectionAndInitialPosition(options, selectedObjectsRef);
    });

    canvas.on("selection:updated", (options) => {
      handleSelectionAndInitialPosition(options, selectedObjectsRef);
    });

    canvas.on("selection:cleared", () => {
      selectedObjectsRef.current = [];
      console.log(
        "Selection cleared: ",
        console.log(selectedObjectsRef.current)
      );
    });

    window.addEventListener("keydown", (e) => {
      handleKeyDown({
        e,
        canvas,
        sendJsonMessage,
      });
    });

    return () => {
      canvas.dispose();
      window.removeEventListener("keydown", (e) => {
        handleKeyDown({
          e,
          canvas,
          sendJsonMessage,
        });
      });
    };
  }, [canvasRef, sendDrawingDataSVG, sendDrawingData, sendJsonMessage]);

  return (
    <>
      <div className="bg-gray-50 flex-1 w-full h-full rounded-md" id="canvas">
        <canvas ref={canvasRef} />
      </div>
      <Toolbar
        lastUsedColorRef={lastUsedColorRef}
        selectedTool={selectedTool}
        handleSelectedToolChange={handleSelectedToolChange}
        canvas={fabricRef}
        sendJsonMessage={sendJsonMessage}
        lastUsedStrokeWidthRef={lastUsedStrokeWidthRef}
        isFillActiveRef={isFillActiveRef}
      />
    </>
  );
}
