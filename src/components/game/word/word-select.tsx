import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import { useCallback, useEffect, useState } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type SelectableWord = {
  id: string;
  word: string;
};

const WordSelect = () => {
  const [open, setOpen] = useState(false);

  const [selectableWords, setSelectableWords] = useState<SelectableWord[]>([]);

  const { timeRemaining, startTimer, stopTimer } = useTimer({
    messageTypes: ["selectWordTimer"],
    timerType: "selectWordTimer",
  });

  const { lastMessage, sendJsonMessage } = useCustomWebsocket({
    messageTypes: ["gameState", "openSelectWordModal", "closeSelectWordModal"],
  });

  //const { lastMessage, sendJsonMessage } = useGame();

  useEffect(() => {
    if (lastMessage) {
      const newMessage = JSON.parse(lastMessage.data);
      const messageType = newMessage.type;

      switch (messageType) {
        case "openSelectWordModal": {
          const words = newMessage.payload.selectableWords;
          console.log("Words: ", words);
          setSelectableWords(words);
          openModal();
          break;
        }

        case "closeSelectWordModal":
          closeModal();
          break;

        default:
          return;
      }
    }
  }, [lastMessage]);

  const openModal = () => {
    setOpen(true);
    startTimer();
  };

  const closeModal = (chosenWord?: string) => {
    setOpen(false);
    stopTimer();

    if (!chosenWord) {
      return;
    }

    sendJsonMessage({
      type: "selectWord",
      payload: {
        word: chosenWord,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        hideCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle>Select a word {timeRemaining}</DialogTitle>
        <DialogDescription>Choose a word to draw</DialogDescription>
        <div className="grid grid-cols-2 gap-4">
          {selectableWords.map((word) => (
            <Button key={word.id} onClick={() => closeModal(word.word)}>
              {word.word}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordSelect;
