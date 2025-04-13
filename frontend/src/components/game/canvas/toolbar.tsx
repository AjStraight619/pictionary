import { SelectedTool } from "@/types/canvas";
import React, { SetStateAction, useState } from "react";
import * as fabric from "fabric";

import { Button } from "@/components/ui/button";
import {
  Circle,
  MousePointer2,
  PaintBucket,
  Pencil,
  Square,
  Trash2,
  Triangle,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#C0C0C0",
  "#808080",
  "#800000",
  "#808000",
];

const BRUSH_SIZES = [5, 7, 9];

function debounce<Args extends unknown[], Return>(
  func: (...args: Args) => Return,
  wait: number
): (...args: Args) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Args) => {
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
  lastUsedColorRef: React.MutableRefObject<string>;
  lastUsedBrushSizeRef: React.MutableRefObject<number>;
};

const Toolbar = ({
  selectedToolRef,
  canvas,
  selectedTool,
  setSelectedTool,
  sendJsonMessage,
  lastUsedColorRef,
  lastUsedBrushSizeRef,
}: ToolbarProps) => {
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentBrushSize, setCurrentBrushSize] = useState(5);

  if (!canvas) return;

  const handleDeleteAll = debounce(() => {
    canvas.clear();
    sendJsonMessage({
      type: "remove-all",
    });
  }, 16);

  const updateBrushColor = (color: string) => {
    if (
      !canvas.freeDrawingBrush &&
      selectedToolRef.current !== SelectedTool.Pencil
    ) {
      setSelectedTool(SelectedTool.Pencil);
      selectedToolRef.current = SelectedTool.Pencil;
      configureBrush(canvas, color, lastUsedBrushSizeRef.current);
    }

    setCurrentColor(color);
    canvas.freeDrawingBrush!.color = color;
    lastUsedColorRef.current = color;
  };

  const updateBrushSize = (size: number) => {
    if (
      !canvas.freeDrawingBrush &&
      selectedToolRef.current !== SelectedTool.Pencil
    ) {
      setSelectedTool(SelectedTool.Pencil);
      selectedToolRef.current = SelectedTool.Pencil;
      configureBrush(canvas, lastUsedColorRef.current, size);
    }

    canvas.freeDrawingBrush!.width = size;
    setCurrentBrushSize(size);
    lastUsedBrushSizeRef.current = size;
  };

  const handleToolChange = (tool: string) => {
    // Map the string value back to the SelectedTool enum
    const selectedToolEnum = tool as SelectedTool;

    // Update the selected tool reference
    selectedToolRef.current = selectedToolEnum;

    // Update the selected tool state
    setSelectedTool(selectedToolEnum);

    // Reset canvas state for all tools
    canvas.isDrawingMode = false;

    // Apply tool-specific logic
    switch (selectedToolEnum) {
      case SelectedTool.Pencil:
        configureBrush(
          canvas,
          lastUsedColorRef.current,
          lastUsedBrushSizeRef.current
        );
        break;

      case SelectedTool.Eraser:
        // TODO: Implement eraser, not a clue yet
        break;

      case SelectedTool.Selector:
        canvas.selection = true; // Enable object selection
        break;

      case SelectedTool.Rectangle:
        canvas.selection = false;
        break;

      case SelectedTool.Circle:
        canvas.selection = false;
        break;

      case SelectedTool.Triangle:
        canvas.selection = false;
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
        <ColorPicker
          onColorChange={updateBrushColor}
          currentColor={currentColor}
        />
        <BrushSizePicker
          onBrushSizeChange={updateBrushSize}
          currentBrushSize={currentBrushSize}
          currentColor={currentColor}
        />
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
  width: number
) => {
  if (!canvas.freeDrawingBrush) {
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
  }

  canvas.isDrawingMode = true;

  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = width;
};

function ColorPicker({
  onColorChange,
  currentColor,
}: {
  onColorChange: (color: string) => void;
  currentColor: string;
}) {
  const [open, setOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onColorChange(color);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost">
          <PaintBucket fill={currentColor} />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center">
        <div className="grid grid-cols-4 gap-2 p-2">
          {COLORS.map((color) => (
            <Button
              key={color}
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BrushSizePicker({
  onBrushSizeChange,
  currentBrushSize,
  currentColor,
}: {
  onBrushSizeChange: (size: number) => void;
  currentBrushSize: number;
  currentColor: string;
}) {
  const [open, setOpen] = useState(false);

  const handleBrushSizeChange = (size: number) => {
    onBrushSizeChange(size);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          <div
            className="rounded-full border border-white"
            style={{
              width: currentBrushSize,
              height: currentBrushSize,
              backgroundColor: currentColor,
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center">
        <div className="grid grid-cols-3 gap-2 p-2">
          {BRUSH_SIZES.map((size) => (
            <Button
              variant="ghost"
              key={size}
              className="rounded-full p-0 min-w-0 flex items-center justify-center"
              style={{
                width: size * 4,
                height: size * 4,
              }}
              onClick={() => handleBrushSizeChange(size)}
            >
              <div
                className="rounded-full border border-white"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: currentColor,
                }}
              />
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
