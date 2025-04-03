import type * as fabric from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import { handleObjectDeletion } from "@/utils/canvas";
import { SelectedTool, type ShapeData } from "@/types/canvas";

import type { FreeHandData } from "@/types/game";
import { useDebouncedCallback, useThrottledCallback } from "use-debounce";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import Toolbar from "@/components/game/canvas/tools/toolbar";
import { useReadLocalStorage } from "usehooks-ts";
import { PlayerInfo } from "@/types/lobby";
import ActiveCursor from "./active-cursor";
import { useCanvasHistory } from "@/hooks/useCanvasHistory";
import { useCanvas } from "@/hooks/useCanvas";

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

  // Initialize canvas history
  const { saveState, undo, redo } = useCanvasHistory(fabricRef);

  // Add logging wrappers for history operations
  const loggedSaveState = useCallback(() => {
    console.log("📝 Saving canvas state");
    saveState();
  }, [saveState]);

  const loggedUndo = useCallback(() => {
    console.log("⏪ Undoing last action");
    undo();
  }, [undo]);

  const loggedRedo = useCallback(() => {
    console.log("⏩ Redoing action");
    redo();
  }, [redo]);

  const { sendJsonMessage } = useCustomWebsocket({
    messageTypes: ["canvas"],
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!fabricRef.current) return;

      // Handle backspace/delete for object removal
      if (e.key === "Backspace" || e.key === "Delete") {
        const canvas = fabricRef.current;
        const activeObjects = canvas.getActiveObjects();

        if (activeObjects.length === 0) return;

        console.log("🗑️ Deleting objects, saving state first");
        // Save state before deletion
        loggedSaveState();

        // Handle the deletion logic
        handleObjectDeletion(canvas, activeObjects, sendJsonMessage);
      }

      // Undo on Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        loggedUndo();
      }

      // Redo on Ctrl+Shift+Z or Ctrl+Y
      if (
        (e.ctrlKey || e.metaKey) &&
        ((e.key === "z" && e.shiftKey) || e.key === "y")
      ) {
        e.preventDefault();
        loggedRedo();
      }
    },
    [loggedSaveState, loggedUndo, loggedRedo, sendJsonMessage]
  );

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

    // Save state after adding a shape
    console.log("🔷 Adding shape, saving state");
    loggedSaveState();
  }, 16);

  // Function to resize canvas when container size changes
  const resizeCanvas = useCallback(() => {
    if (!fabricRef.current || !containerRef.current) return;

    const parentElement = containerRef.current.parentElement;
    if (!parentElement) return;

    const parentWidth = parentElement.clientWidth;
    const parentHeight = parentElement.clientHeight;

    // Determine the maximum size the container can be while maintaining 4:3
    let containerWidth, containerHeight;

    if (parentWidth / parentHeight > 4 / 3) {
      // Parent is wider than 4:3, so height is the limiting factor
      containerHeight = parentHeight;
      containerWidth = containerHeight * (4 / 3);
    } else {
      // Parent is taller than 4:3, so width is the limiting factor
      containerWidth = parentWidth;
      containerHeight = containerWidth * (3 / 4);
    }

    // Set container size explicitly to maintain 4:3 aspect ratio
    containerRef.current.style.width = `${containerWidth}px`;
    containerRef.current.style.height = `${containerHeight}px`;

    // Update canvas size using non-deprecated methods
    fabricRef.current.setDimensions({
      width: containerWidth,
      height: containerHeight,
    });

    // Update zoom level based on the original 800px design width
    fabricRef.current.setZoom(containerWidth / 800);
    fabricRef.current.renderAll();
  }, []);

  // Initialize canvas once
  useCanvas(
    canvasRef,
    fabricRef,
    selectedToolRef,
    isMouseDownRef,
    pathDataRef,
    lastUsedColorRef,
    setSelectedTool,
    sendDrawingData,
    sendSvgShape,
    loggedSaveState
  );

  // Combined event listeners in a single useEffect
  useEffect(() => {
    // Set up keyboard and resize event listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", resizeCanvas);

    // Initial resize
    resizeCanvas();

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [handleKeyDown, resizeCanvas]);

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
        className="border border-gray-200 shadow-inner"
        width="800"
        height="600"
      />

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
