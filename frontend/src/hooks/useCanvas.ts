import { useEffect } from "react";
import * as fabric from "fabric";
import {
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handlePathCreated,
  handleMouseUp,
  handleObjectModified,
} from "@/utils/canvas";
import { SelectedTool, ShapeData } from "@/types/canvas";
import { FreeHandData } from "@/types/game";
import { initializeCanvas } from "@/utils/canvas";

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  fabricRef: React.MutableRefObject<fabric.Canvas | null>,
  selectedToolRef: React.MutableRefObject<SelectedTool>,
  isMouseDownRef: React.MutableRefObject<boolean>,
  pathDataRef: React.MutableRefObject<fabric.Point[]>,
  lastUsedColorRef: React.MutableRefObject<string>,
  setSelectedTool: React.Dispatch<React.SetStateAction<SelectedTool>>,
  sendDrawingData: (data: FreeHandData) => void,
  sendSvgShape: (shapeData: ShapeData) => void,
  saveState: () => void
) {
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

      // Save state after path creation
      saveState();
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

      // Save state after object modification
      saveState();
    });

    return () => {
      canvas.dispose();
    };
  }, []);
}
