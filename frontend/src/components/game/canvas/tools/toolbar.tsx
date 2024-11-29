import { SelectedTool } from '@/types/canvas';
import React, { useState } from 'react';
import * as fabric from 'fabric';

import { Button } from '@/components/ui/button';
import { Eraser, MousePointer2, Pencil } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ToolbarProps = {
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas | null;
};

const Toolbar = ({ selectedToolRef, canvas }: ToolbarProps) => {
  const handleToolChange = (tool: SelectedTool) => {
    if (!canvas) return;

    // Update the selected tool reference
    selectedToolRef.current = tool;

    // Reset canvas state for all tools
    canvas.isDrawingMode = false;

    switch (tool) {
      case SelectedTool.Pencil:
        canvas.isDrawingMode = true;
        configureBrush(canvas, 'black', 5);
        break;

      case SelectedTool.Eraser:
        // canvas.isDrawingMode = true;
        // configureBrush(canvas, 'rgba(255,255,255,1)', 10); // Eraser color and size
        break;

      case SelectedTool.Selector:
        canvas.selection = true; // Enable object selection
        break;

      default:
        console.warn('Unhandled tool:', tool);
        break;
    }
  };

  return (
    <div className="absolute bottom-2 transform -translate-x-1/2 left-1/2 p-4 rounded-md bg-background">
      <div className="flex items-center justify-center gap-x-2">
        {/* <Button onClick={() => handleToolChange(SelectedTool.Selector)}>
          <MousePointer2 />
        </Button>
        <Button>
          <Pencil />
        </Button> */}
        <ToggleGroup
          defaultValue={SelectedTool.Selector.toString()}
          type="single"
        >
          <ToggleGroupItem
            onClick={() => handleToolChange(SelectedTool.Selector)}
            value={SelectedTool.Selector.toString()}
          >
            <MousePointer2 />
          </ToggleGroupItem>
          <ToggleGroupItem
            onClick={() => handleToolChange(SelectedTool.Pencil)}
            value={SelectedTool.Pencil.toString()}
          >
            <Pencil />
          </ToggleGroupItem>
          <ToggleGroupItem
            onClick={() => handleToolChange(SelectedTool.Eraser)}
            value={SelectedTool.Eraser.toString()}
          >
            <Eraser />
          </ToggleGroupItem>
        </ToggleGroup>
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
  canvas.freeDrawingBrush.color = color;
  canvas.freeDrawingBrush.width = width;
};

// const configureEraser = (canvas: fabric.Canvas) => {
//   if (!canvas.freeDrawingBrush) {
//     canvas.freeDrawingBrush = new fabric.
//   }
//   canvas.freeDrawingBrush.color = 'rgba(255,255,255,1)';
//   canvas.freeDrawingBrush.width = 10;
// };
