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
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useIsCurrentDrawer } from "@/hooks/useIsCurrentDrawer";

const WordSelect = () => {
  const selectableWords = useSelectableWords();
  const isSelectingWord = useIsSelectingWord();
  const isCurrentDrawer = useIsCurrentDrawer();

  const { timeRemaining } = useTimer({
    timerType: "selectWordTimer",
    messageTypes: ["selectWordTimer"],
  });

  const { sendJsonMessage } = useCustomWebsocket({ messageTypes: [] });

  const handleSelectWord = (chosenWord: Word) => {
    // stopTimer();
    console.log("Selected word:", chosenWord);
    sendJsonMessage({
      type: "selectWord",
      payload: { word: chosenWord },
    });
  };

  return (
    <Dialog open={isSelectingWord && isCurrentDrawer}>
      <DialogContent
        hideCloseButton={true}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogTitle className="flex items-center justify-between">
          <span className="text-gradient-pictionary">
            Select a word to draw
          </span>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-950/50 border border-indigo-500/50 rounded-full">
            <Clock className="h-4 w-4 text-yellow-400" />
            <div className="text-yellow-300">{timeRemaining}</div>
          </div>
        </DialogTitle>
        <DialogDescription className="text-yellow-100">
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
                className="w-full h-12 text-lg font-bold text-black bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-500 hover:to-pink-600 shadow-[0_0_10px_rgba(255,214,0,0.3)] hover:shadow-[0_0_15px_rgba(255,214,0,0.5)] transition-all duration-300"
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
