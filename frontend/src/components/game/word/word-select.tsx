import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useSelectableWords,
  useIsSelectingWord,
} from "@/hooks/useGameSelector";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import type { Word } from "@/types/game";
import { useState } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useIsCurrentDrawer } from "@/hooks/useIsCurrentDrawer";

const WordSelect = () => {
  const selectableWords = useSelectableWords();
  const isSelectingWord = useIsSelectingWord();
  const isCurrentDrawer = useIsCurrentDrawer();

  const [_, setOpen] = useState(isSelectingWord);

  const { timeRemaining, stopTimer } = useTimer({
    timerType: "selectWordTimer",
    messageTypes: ["selectWordTimer"],
  });

  const { sendJsonMessage } = useCustomWebsocket({ messageTypes: [] });

  const handleSelectWord = (chosenWord: Word) => {
    stopTimer();
    setOpen(false);
    sendJsonMessage({
      type: "selectWord",
      payload: { word: chosenWord },
    });
  };

  return (
    <Dialog open={isSelectingWord && isCurrentDrawer} onOpenChange={setOpen}>
      <DialogContent
        hideCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogTitle className="flex items-center justify-between">
          <span>Select a word to draw</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>{timeRemaining}</div>
          </div>
        </DialogTitle>
        <DialogDescription>
          Choose one of these words to draw for other players to guess
        </DialogDescription>
        <div className="grid grid-cols-1 gap-3 pt-2">
          {selectableWords?.map((word, index) => (
            <motion.div
              key={word.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                onClick={() => handleSelectWord(word)}
                className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {word.word.toLowerCase()}
              </Button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordSelect;
