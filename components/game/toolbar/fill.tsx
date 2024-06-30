import { Button } from "@/components/ui/button";
import { PaintBucketIcon } from "lucide-react";

type FillProps = {
  handleFillActive: () => void;
  isFillActive: boolean;
  lastUsedColorRef: React.MutableRefObject<string>;
};
export default function Fill({
  handleFillActive,
  isFillActive,
  lastUsedColorRef,
}: FillProps) {
  return (
    <Button
      onClick={() => handleFillActive()}
      variant={`${isFillActive ? "default" : "ghost"}`}
      size="icon"
    >
      <PaintBucketIcon size={20} fill={lastUsedColorRef.current} />
    </Button>
  );
}
