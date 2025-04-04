// src/hooks/useCanvasHistory.ts
import { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

// Define a type for serialized fabric objects
interface SerializedFabricObject {
  id?: string;
  type?: string;
  svg?: string;
  [key: string]: string | number | boolean | object | undefined;
}

// Track what type of action occurred for each history state
type HistoryAction = {
  state: SerializedFabricObject[]; // Serialized fabric objects
  actionType: "create" | "delete" | "modify";
  objectIds: string[]; // IDs of affected objects
};

export const useCanvasHistory = (
  canvasRef: React.MutableRefObject<fabric.Canvas | null>,
  sendJsonMessage?: SendJsonMessage
) => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<HistoryAction[]>([]);
  const currentIndexRef = useRef(-1);

  // Save current canvas state to history with action metadata
  const saveState = useCallback(
    (
      actionType: "create" | "delete" | "modify" = "modify",
      objectIds: string[] = []
    ) => {
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

      // Add new state with action metadata
      historyRef.current.push({
        state: objects as SerializedFabricObject[],
        actionType,
        objectIds,
      });
      currentIndexRef.current++;

      // Update UI state
      setCanUndo(currentIndexRef.current > 0);
      setCanRedo(false);

      console.log(
        `Saved state ${
          currentIndexRef.current
        }, action: ${actionType}, objects: ${objectIds.join(
          ","
        )}, history size: ${historyRef.current.length}`
      );
    },
    [canvasRef]
  );

  // Restore canvas to a specific state
  const restoreState = useCallback(
    async (canvas: fabric.Canvas, stateIndex: number) => {
      if (!historyRef.current[stateIndex]) return;

      // Clear canvas
      canvas.clear();

      try {
        // Load the objects using Promise-based API
        const objects = await fabric.util.enlivenObjects(
          historyRef.current[stateIndex].state
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

  // Find an object in a state by ID
  const findObjectInState = useCallback(
    (stateIndex: number, objectId: string) => {
      if (!historyRef.current[stateIndex]) return null;

      return historyRef.current[stateIndex].state.find(
        (obj: SerializedFabricObject) => obj.id === objectId
      );
    },
    []
  );

  // Undo last action with WebSocket messaging
  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndexRef.current <= 0) return;

    // Get information about what we're undoing
    const currentAction = historyRef.current[currentIndexRef.current];

    // Move back in history
    currentIndexRef.current--;

    // Restore canvas visual state
    restoreState(canvas, currentIndexRef.current);

    // Send WebSocket messages to sync other clients if callback provided
    if (sendJsonMessage && currentAction) {
      if (currentAction.actionType === "create") {
        // If we're undoing a creation, send deletion messages
        currentAction.objectIds.forEach((id) => {
          console.log(`Undo: Sending delete for object ${id}`);
          sendJsonMessage({
            type: "remove-element",
            payload: { id },
          });
        });
      } else if (currentAction.actionType === "delete") {
        // Find the deleted objects in the previous state
        currentAction.objectIds.forEach((id) => {
          // Find objects in states before the deletion
          for (let i = currentIndexRef.current; i >= 0; i--) {
            const obj = findObjectInState(i, id);
            if (obj) {
              // Found the object, recreate it
              console.log(`Undo: Recreating deleted object ${id}`);
              sendJsonMessage({
                type: "shape",
                payload: {
                  id,
                  svg: obj.svg || "",
                  type: obj.type,
                },
              });
              break;
            }
          }
        });
      } else if (currentAction.actionType === "modify") {
        // For modifications, restore object state
        currentAction.objectIds.forEach((id) => {
          const obj = findObjectInState(currentIndexRef.current, id);
          if (obj) {
            console.log(`Undo: Updating modified object ${id}`);
            sendJsonMessage({
              type: "shape",
              payload: {
                id,
                svg: obj.svg || "",
                type: obj.type,
              },
            });
          }
        });
      }
    }

    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(true);
  }, [canvasRef, restoreState, sendJsonMessage, findObjectInState]);

  // Redo previously undone action
  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentIndexRef.current >= historyRef.current.length - 1)
      return;

    // What action are we restoring
    const targetIndex = currentIndexRef.current + 1;
    const targetAction = historyRef.current[targetIndex];

    // Move forward in history
    currentIndexRef.current++;

    // Restore canvas visual state
    restoreState(canvas, currentIndexRef.current);

    // Send WebSocket messages
    if (sendJsonMessage && targetAction) {
      if (targetAction.actionType === "create") {
        // Redo a creation - send shape messages
        targetAction.objectIds.forEach((id) => {
          const obj = findObjectInState(targetIndex, id);
          if (obj) {
            console.log(`Redo: Recreating object ${id}`);
            sendJsonMessage({
              type: "shape",
              payload: {
                id,
                svg: obj.svg || "",
                type: obj.type,
              },
            });
          }
        });
      } else if (targetAction.actionType === "delete") {
        // Redo a deletion - send remove messages
        targetAction.objectIds.forEach((id) => {
          console.log(`Redo: Deleting object ${id}`);
          sendJsonMessage({
            type: "remove-element",
            payload: { id },
          });
        });
      } else if (targetAction.actionType === "modify") {
        // Redo a modification - update objects
        targetAction.objectIds.forEach((id) => {
          const obj = findObjectInState(targetIndex, id);
          if (obj) {
            console.log(`Redo: Updating object ${id}`);
            sendJsonMessage({
              type: "shape",
              payload: {
                id,
                svg: obj.svg || "",
                type: obj.type,
              },
            });
          }
        });
      }
    }

    setCanUndo(true);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
  }, [canvasRef, restoreState, sendJsonMessage, findObjectInState]);

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
