import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useHost } from "@/hooks/useGameSelector";
import { UserMinus } from "lucide-react";
import { useState } from "react";

const RemovePlayer = ({
  playerID,
  name,
}: {
  playerID: string;
  name: string;
}) => {
  const [open, setOpen] = useState(false);
  const host = useHost();
  const { sendWSMessage } = useCustomWebsocket({
    messageTypes: ["removePlayer"],
  });

  const handleRemovePlayer = () => {
    console.log("playerID", playerID);
    if (host) {
      sendWSMessage("removePlayer", {
        playerID,
        hostID: host.ID,
      });
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserMinus />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogDescription>
          Remove {name} from the game
        </AlertDialogDescription>
        <AlertDialogHeader>
          <AlertDialogTitle>Do you want to remove {name}?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="destructive" onClick={handleRemovePlayer}>
            Remove
          </Button>

          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RemovePlayer;
