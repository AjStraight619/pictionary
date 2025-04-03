// src/hooks/useCanvasHistory.ts
import { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";

export const useCanvasHistory = (
  canvasRef: React.MutableRefObject<fabric.Canvas | null>
) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<fabric.Object[][]>([]);
  const currentIndexRef = useRef(-1);

  // Save current canvas state to history
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get a serialized version of all objects
    const objects = canvas
      .getObjects()
      .map((obj) => obj.toObject(["id", "originX", "originY"]));

    // If we're not at the end of the history, truncate
    if (currentIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(
        0,
        currentIndexRef.current + 1
      );
    }

    // Add new state and update index
    historyRef.current.push(objects);
    currentIndexRef.current++;

    // Update UI state
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(false);

    console.log(
      `Saved state ${currentIndexRef.current}, history size: ${historyRef.current.length}`
    );
  }, [canvasRef]);

  // Restore canvas to a specific state
  const restoreState = useCallback(
    async (canvas: fabric.Canvas, stateIndex: number) => {
      if (!historyRef.current[stateIndex]) return;

      // Clear canvas
      canvas.clear();

      try {
        // Load the objects using Promise-based API
        const objects = await fabric.util.enlivenObjects(
          historyRef.current[stateIndex]
        );

        // Add objects to canvas
        objects.forEach((obj) => canvas.add(obj as fabric.Object));
        canvas.renderAll();
      } catch (error) {
        console.error("Failed to restore canvas state:", error);
      }
    },
    []
  );

  // Undo last action
  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndexRef.current <= 0) return;

    currentIndexRef.current--;
    restoreState(canvas, currentIndexRef.current);

    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(true);
  }, [canvasRef, restoreState]);

  // Redo previously undone action
  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndexRef.current >= historyRef.current.length - 1)
      return;

    currentIndexRef.current++;
    restoreState(canvas, currentIndexRef.current);

    setCanUndo(true);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
  }, [canvasRef, restoreState]);

  // Clear all history
  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return {
    saveState,
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
  };
};
