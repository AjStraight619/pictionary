import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DotIcon } from "lucide-react";
import React from "react";

type StrokePickerProps = {
  strokeWidth: number;
  setStrokeWidth: (strokeWidth: number) => void;
  lastUsedColorRef: React.MutableRefObject<string>;
};

export default function StrokePicker({
  strokeWidth,
  setStrokeWidth,
  lastUsedColorRef,
}: StrokePickerProps) {
  const strokeWidthOptions = [
    {
      value: 3,
      icon: React.createElement(DotIcon, {
        size: 15,
        fill: lastUsedColorRef.current,
      }),
    },
    {
      value: 5,
      icon: React.createElement(DotIcon, {
        size: 25,
        fill: lastUsedColorRef.current,
      }),
    },
    {
      value: 7,
      icon: React.createElement(DotIcon, {
        size: 35,
        fill: lastUsedColorRef.current,
      }),
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <DotIcon fill={lastUsedColorRef.current} size={strokeWidth * 5} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <ul>
          {strokeWidthOptions.map((opt, idx) => (
            <li key={idx}>
              <Button
                onClick={() => setStrokeWidth(opt.value)}
                variant="ghost"
                size="icon"
              >
                {opt.icon}
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
