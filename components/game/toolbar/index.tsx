import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tool } from "@/types/canvas";
import { fabric } from "fabric";
import {
  CircleIcon,
  DotIcon,
  MousePointer2,
  PaintBucketIcon,
  PaletteIcon,
  PencilIcon,
  RectangleHorizontalIcon,
  TrashIcon,
  TriangleIcon,
} from "lucide-react";
import React, { ReactNode, useCallback, useEffect, useState } from "react";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import ColorPicker from "./color-picker";
import StrokePicker from "./stroke-picker";
import DeleteObjects from "./delete-objects";
import Fill from "./fill";

type ToolbarProps = {
  handleSelectedToolChange: (tool: Tool) => void;
  selectedTool: Tool;
  canvas: React.MutableRefObject<fabric.Canvas | null>;
  sendJsonMessage: SendJsonMessage;
  lastUsedColorRef: React.MutableRefObject<string>;
  lastUsedStrokeWidthRef: React.MutableRefObject<number>;
  isFillActiveRef: React.MutableRefObject<boolean>;
};

export default function Toolbar({
  handleSelectedToolChange,
  selectedTool,
  canvas,
  sendJsonMessage,
  lastUsedColorRef,
  lastUsedStrokeWidthRef,
  isFillActiveRef,
}: ToolbarProps) {
  const [color, setColor] = useState("");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isFillActive, setIsFillActive] = useState(false);

  const toolbarButtons = [
    {
      name: Tool.selector,
      icon: React.createElement(MousePointer2, {
        size: 20,
        fill: lastUsedColorRef.current,
      }),
    },
    {
      name: Tool.pencil,
      icon: React.createElement(PencilIcon, {
        size: 20,
        fill: lastUsedColorRef.current,
      }),
    },
    {
      name: Tool.rect,
      icon: React.createElement(RectangleHorizontalIcon, {
        size: 20,
        fill: lastUsedColorRef.current,
      }),
    },
    {
      name: Tool.circle,
      icon: React.createElement(CircleIcon, {
        size: 20,
        fill: lastUsedColorRef.current,
      }),
    },
    {
      name: Tool.triangle,
      icon: React.createElement(TriangleIcon, {
        size: 20,
        fill: lastUsedColorRef.current,
      }),
    },
  ];

  const handleColorChange = useCallback(
    (newColor: string) => {
      setColor(newColor);
      lastUsedColorRef.current = newColor;
      if (canvas.current) {
        console.log("new color: ", newColor);
        canvas.current.freeDrawingBrush.color = newColor;
      }
    },
    [lastUsedColorRef, canvas]
  );

  const handleStrokeWidthChange = useCallback(
    (newStrokeWidth: number) => {
      setStrokeWidth(newStrokeWidth);
      lastUsedStrokeWidthRef.current = newStrokeWidth;
      if (canvas.current && canvas.current.freeDrawingBrush) {
        canvas.current.freeDrawingBrush.width = newStrokeWidth;
      }
    },
    [lastUsedStrokeWidthRef, canvas]
  );

  const handleDeleteObjects = useCallback(() => {
    if (canvas.current) {
      canvas.current.clear();
      sendJsonMessage({
        type: "drawing",
        data: { svg: "delete" },
      });
    }
  }, [sendJsonMessage, canvas]);

  const handleFillActive = useCallback(() => {
    isFillActiveRef.current = !isFillActiveRef.current;
    setIsFillActive((prev) => !prev);
    console.log("Is fill active ref: ", isFillActiveRef.current);
  }, [isFillActiveRef]);

  return (
    <div className="fixed bottom-10 -translate-x-1/2 left-1/2 p-2 rounded-md shadow-xl bg-white flex items-center justify-center h-16">
      {toolbarButtons.map((btn, idx) => (
        <ToolbarButton
          key={idx}
          isActive={selectedTool === btn.name}
          onClick={() => handleSelectedToolChange(btn.name)}
        >
          {btn.icon}
        </ToolbarButton>
      ))}
      <Separator orientation="vertical" className="mx-2 h-full" />
      <ColorPicker
        color={color}
        setColor={handleColorChange}
        lastUsedColorRef={lastUsedColorRef}
      />
      <Fill
        isFillActive={isFillActive}
        handleFillActive={handleFillActive}
        lastUsedColorRef={lastUsedColorRef}
      />

      <StrokePicker
        strokeWidth={strokeWidth}
        setStrokeWidth={handleStrokeWidthChange}
        lastUsedColorRef={lastUsedColorRef}
      />
      <DeleteObjects handleDeleteObjects={handleDeleteObjects} />
    </div>
  );
}

type ToolbarButtonProps = {
  isActive: boolean;
  children: ReactNode;
  onClick: () => void;
};

function ToolbarButton({ isActive, children, onClick }: ToolbarButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant={isActive ? "default" : "ghost"}
    >
      {children}
    </Button>
  );
}
