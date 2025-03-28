import type * as fabric from "fabric";
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
import { SelectedTool, type ShapeData } from "@/types/canvas";

import type { FreeHandData } from "@/types/game";
import { useDebouncedCallback, useThrottledCallback } from "use-debounce";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import Toolbar from "@/components/game/canvas/tools/toolbar";

const DrawerCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>(
    SelectedTool.Selector
  );
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

  // Function to resize canvas when container size changes
  const resizeCanvas = () => {
    if (!fabricRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Maintain aspect ratio (4:3) while fitting in the container
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > 4 / 3) {
      // Container is wider than 4:3, so height is the limiting factor
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * (4 / 3);
    } else {
      // Container is taller than 4:3, so width is the limiting factor
      canvasWidth = containerWidth;
      canvasHeight = containerWidth * (3 / 4);
    }

    fabricRef.current.setWidth(canvasWidth);
    fabricRef.current.setHeight(canvasHeight);
    fabricRef.current.setZoom(canvasWidth / 800); // Scale objects based on original 800px width
    fabricRef.current.renderAll();
  };

  useEffect(() => {
    const canvas = initializeCanvas({ fabricRef, canvasRef, id: "canvas" });
    if (!canvas) return;

    // Set initial size
    if (containerRef.current) {
      const container = containerRef.current;
      canvas.setWidth(container.clientWidth);
      canvas.setHeight(container.clientHeight);
    }

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
        sendJsonMessage,
      });
    });

    // Add resize listener
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    // Initial resize
    handleResize();

    return () => {
      canvas.dispose();
      window.removeEventListener("keydown", (e) => {
        handleKeyDownEvents({
          e,
          canvas,
          sendJsonMessage,
        });
      });
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white rounded-lg relative flex items-center justify-center"
      id="canvas-container"
    >
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
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
