import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";

type DeleteObjectProps = {
  handleDeleteObjects: () => void;
};

export default function DeleteObjects({
  handleDeleteObjects,
}: DeleteObjectProps) {
  return (
    <Button size="icon" variant="ghost" onClick={() => handleDeleteObjects()}>
      <Trash2Icon />
    </Button>
  );
}
