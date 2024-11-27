import { SelectedTool } from '@/types/canvas';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Eraser, MousePointer2, Pencil } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ToolbarProps = {
  selectedToolRef: React.MutableRefObject<SelectedTool>;
};

const Toolbar = ({ selectedToolRef }: ToolbarProps) => {
  const handleToolChange = (tool: SelectedTool) => {
    selectedToolRef.current = tool;
  };

  return (
    <div className="absolute bottom-2 transform -translate-x-1/2 left-1/2 p-4 rounded-md bg-white">
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
