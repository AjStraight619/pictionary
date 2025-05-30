import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { useGameEventDialog } from "@/hooks/useGameSelector";
const getDialogDescriptions = (eventType: string) => {
  switch (eventType) {
    case "Turn End":
      return "Turn summary";
    case "Round End":
      return "Round summary";
    default:
      return "";
  }
};

export default function GameEventDialog() {
  const eventDialog = useGameEventDialog();

  if (!eventDialog) return null;

  return (
    <Dialog open={eventDialog.open}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{}</DialogTitle>
          <DialogDescription>
            {getDialogDescriptions(eventDialog.eventType)}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
