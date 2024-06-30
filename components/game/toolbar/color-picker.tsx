import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { HexColorPicker } from "react-colorful";

type ColorPickerProps = {
  color: string;
  setColor: (color: string) => void;
  lastUsedColorRef: React.MutableRefObject<string>;
};

export default function ColorPicker({
  color,
  setColor,
  lastUsedColorRef,
}: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost">
          <Palette color={lastUsedColorRef.current} size={20} />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <HexColorPicker color={color} onChange={setColor} />
      </PopoverContent>
    </Popover>
  );
}
