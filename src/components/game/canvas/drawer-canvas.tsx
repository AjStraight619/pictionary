import * as fabric from "fabric";
import { useEffect, useRef, useState } from "react";
import {
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleKeyDownEvents,
  handleMouseUp,
  handleObjectModified,
  handlePathCreated,
  initializeCanvas,
} from "@/utils/canvas";
import { SelectedTool, ShapeData } from "@/types/canvas";
import Toolbar from "./tools/toolbar";

import { FreeHandData } from "@/types/game";
import { useDebouncedCallback, useThrottledCallback } from "use-debounce";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

const DrawerCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>(
    SelectedTool.Selector,
  );
  const canvasHistoryRef = useRef<fabric.Object[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isMouseDownRef = useRef<boolean>(false);
  const pathDataRef = useRef<fabric.Point[]>([]);
  const lastUsedColorRef = useRef<string>("#000000");
  const lastUsedBrushSizeRef = useRef<number>(5);

  const { sendJsonMessage } = useCustomWebsocket({
    messageTypes: ["canvas"],
  });

  const sendDrawingData = useThrottledCallback((drawingData: FreeHandData) => {
    sendJsonMessage({
      type: "drawing",
      payload: drawingData,
    });
  }, 16);

  const sendSvgShape = useDebouncedCallback((shapeData: ShapeData) => {
    sendJsonMessage({
      type: "shape",
      payload: shapeData,
    });
  }, 16);

  useEffect(() => {
    const canvas = initializeCanvas({ fabricRef, canvasRef, id: "canvas" });
    if (!canvas) return;

    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        selectedToolRef,
        canvas,
        sendDrawingData,
        sendSvgShape,
        isMouseDownRef,
        pathDataRef,
        lastUsedColorRef,
        lastUsedBrushSizeRef,
      });
    });

    canvas.on("mouse:move", (options) => {
      handleCanvasMouseMove({
        options,
        selectedToolRef,
        canvas,
        sendDrawingData,
        isMouseDownRef,
        pathDataRef,
        lastUsedColorRef,
        lastUsedBrushSizeRef,
      });
    });

    canvas.on("path:created", (options) => {
      const path = options.path;
      handlePathCreated({ path, sendSvgShape });
    });

    canvas.on("mouse:up", () => {
      handleMouseUp({
        canvas,
        selectedToolRef,
        setSelectedTool,
        isMouseDownRef,
        pathDataRef,
      });
    });

    canvas.on("object:modified", () => {
      handleObjectModified({ canvas, sendSvgShape });
    });

    window.addEventListener("keydown", (e) => {
      handleKeyDownEvents({
        e,
        canvas,
        historyIndexRef,
        canvasHistoryRef,
        sendJsonMessage,
      });
    });

    return () => {
      canvas.dispose();
      window.removeEventListener("keydown", (e) => {
        handleKeyDownEvents({
          e,
          canvas,
          historyIndexRef,
          canvasHistoryRef,
          sendJsonMessage,
        });
      });
    };
  }, []);

  // If the drawer leaves the game or reloads the page, send a message to remove all elements

  return (
    <div className="bg-gray-100 rounded-lg shadow-lg relative" id="canvas">
      <canvas className="w-[800px] h-[600px]" ref={canvasRef} />
      <Toolbar
        selectedToolRef={selectedToolRef}
        canvas={fabricRef.current}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        sendJsonMessage={sendJsonMessage}
        lastUsedColorRef={lastUsedColorRef}
        lastUsedBrushSizeRef={lastUsedBrushSizeRef}
      />
    </div>
  );
};

export default DrawerCanvas;

//useEffect(() => {
//  window.addEventListener("unload", () => {
//    handleUnload();
//  });
//
//  const handleUnload = () => {
//    sendJsonMessage({
//      type: "remove-all",
//    });
//  };
//
//  return () => {
//    window.removeEventListener("unload", () => {
//      handleUnload();
//    });
//  };
//}, []);
