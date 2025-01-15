import { SelectedTool } from "@/types/canvas";
import React, { SetStateAction } from "react";
import * as fabric from "fabric";

import { Button } from "@/components/ui/button";
import {
  Circle,
  MousePointer2,
  Pencil,
  Square,
  Trash2,
  Triangle,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { useThrottledCallback } from "use-debounce";

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

type ToolbarProps = {
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas | null;
  selectedTool: SelectedTool;
  setSelectedTool: React.Dispatch<SetStateAction<SelectedTool>>;
  sendJsonMessage: SendJsonMessage;
};
// TODO: Might neeed top change toolbar state to selectedTool rather than ref for.
const Toolbar = ({
  selectedToolRef,
  canvas,
  selectedTool,
  setSelectedTool,
  sendJsonMessage,
}: ToolbarProps) => {
  if (!canvas) return;

  const handleDeleteAll = debounce(() => {
    canvas.clear();
    sendJsonMessage({
      type: "remove-all",
    });
  }, 16);

  const handleToolChange = (tool: string) => {
    console.log("Tool: ", tool);
    // Map the string value back to the SelectedTool enum
    const selectedToolEnum = tool as SelectedTool;
    console.log("Selected Tool Enum: ", selectedToolEnum);
    // Update the selected tool reference
    selectedToolRef.current = selectedToolEnum;

    console.log("SelectedToolRef: ", selectedToolRef.current);
    // Update the selected tool state
    setSelectedTool(selectedToolEnum);

    // Reset canvas state for all tools
    canvas.isDrawingMode = false;

    // Apply tool-specific logic
    switch (selectedToolEnum) {
      case SelectedTool.Pencil:
        //canvas.isDrawingMode = true;
        configureBrush(canvas, "black", 5);
        break;

      case SelectedTool.Eraser:
        // Implement eraser logic if needed
        break;

      case SelectedTool.Selector:
        canvas.selection = true; // Enable object selection
        canvas.isDrawingMode = false;
        break;

      case SelectedTool.Rectangle:
        canvas.selection = false;
        canvas.isDrawingMode = false;
        break;

      case SelectedTool.Circle:
        canvas.selection = false;
        canvas.isDrawingMode = false;
        break;

      case SelectedTool.Triangle:
        canvas.selection = false;
        canvas.isDrawingMode = false;
        break;

      default:
        console.warn("Unhandled tool:", tool);
        break;
    }
  };

  return (
    <div className="absolute bottom-2 transform -translate-x-1/2 left-1/2 p-4 rounded-md bg-background">
      <div className="flex items-center justify-center gap-x-2">
        <ToggleGroup
          type="single"
          value={selectedTool}
          defaultValue={SelectedTool.Selector}
          onValueChange={(value) => handleToolChange(value)}
        >
          <ToggleGroupItem value="Selector">
            <MousePointer2 />
          </ToggleGroupItem>
          <ToggleGroupItem value="Pencil">
            <Pencil />
          </ToggleGroupItem>
          <ToggleGroupItem value="Rectangle">
            <Square />
          </ToggleGroupItem>

          <ToggleGroupItem value="Circle">
            <Circle />
          </ToggleGroupItem>
          <ToggleGroupItem value="Triangle">
            <Triangle />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button onClick={handleDeleteAll} size="icon" variant="ghost">
          <Trash2 />
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;

const configureBrush = (
  canvas: fabric.Canvas,
  color: string,
  width: number,
) => {
  if (!canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  }

  canvas.isDrawingMode = true;

  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = width;
};
