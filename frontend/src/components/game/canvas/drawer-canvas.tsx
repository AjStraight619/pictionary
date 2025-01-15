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
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

import { FreeHandData } from "@/types/game";
import { useDebouncedCallback, useThrottledCallback } from "use-debounce";

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
    console.log("sending svg shape: ", shapeData);
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

  return (
    <div className="flex flex-col gap-y-2">
      <div className="bg-gray-100 rounded-lg shadow-lg relative" id="canvas">
        <canvas className="w-[800px] h-[600px]" ref={canvasRef} />
        <Toolbar
          selectedToolRef={selectedToolRef}
          canvas={fabricRef.current}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          sendJsonMessage={sendJsonMessage}
        />
      </div>
    </div>
  );
};

export default DrawerCanvas;
