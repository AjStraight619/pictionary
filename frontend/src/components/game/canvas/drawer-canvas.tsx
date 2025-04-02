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
import { useReadLocalStorage } from "usehooks-ts";
import { PlayerInfo } from "@/types/lobby";
import ActiveCursor from "./active-cursor";

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
  const playerInfo = useReadLocalStorage<PlayerInfo>("playerInfo");
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ x: 0, y: 0, pctX: 0, pctY: 0 });

  const { sendJsonMessage } = useCustomWebsocket({
    messageTypes: ["canvas"],
  });

  const sendCursorPosition = useThrottledCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !canvasRef.current) return;

    // Get canvas bounds (not container bounds)
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate position relative to canvas (not container)
    const relativeX = e.clientX - canvasRect.left;
    const relativeY = e.clientY - canvasRect.top;

    // Convert to percentage of canvas dimensions
    const percentX = relativeX / canvasRect.width;
    const percentY = relativeY / canvasRect.height;

    // Update debug info if debug mode is enabled
    if (debugMode) {
      setDebugInfo({
        x: relativeX,
        y: relativeY,
        pctX: percentX,
        pctY: percentY,
      });
    }

    sendJsonMessage({
      type: "cursorUpdate",
      payload: {
        playerID: playerInfo?.playerID,
        cursor: {
          x: percentX,
          y: percentY,
          color: lastUsedColorRef.current,
        },
      },
    });
  }, 10);

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

    // Maintain 4:3 aspect ratio while maximizing canvas size
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > 4 / 3) {
      // Container is wider than 4:3, height is limiting factor
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * (4 / 3);
    } else {
      // Container is taller than 4:3, width is limiting factor
      canvasWidth = containerWidth;
      canvasHeight = containerWidth * (3 / 4);
    }

    // Set canvas dimensions to match the calculated size
    fabricRef.current.setWidth(canvasWidth);
    fabricRef.current.setHeight(canvasHeight);
    fabricRef.current.setZoom(canvasWidth / 800); // Scale objects based on original 800px width
    fabricRef.current.renderAll();
  };

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

  // Add keypress handler for debug mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle debug mode with Ctrl+D
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white rounded-lg relative flex items-center justify-center"
      id="canvas-container"
      onMouseMove={sendCursorPosition}
    >
      <ActiveCursor />
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain"
      />

      {debugMode && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 z-50 text-xs">
          <div>
            Container: {containerRef.current?.clientWidth}x
            {containerRef.current?.clientHeight}
          </div>
          <div>
            Canvas: {canvasRef.current?.width}x{canvasRef.current?.height}
          </div>
          <div>
            Mouse Pos: {debugInfo.x.toFixed(1)}x{debugInfo.y.toFixed(1)}
          </div>
          <div>
            Percent: {(debugInfo.pctX * 100).toFixed(1)}%x
            {(debugInfo.pctY * 100).toFixed(1)}%
          </div>
          <div>Press Ctrl+D to hide debug</div>
        </div>
      )}

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
