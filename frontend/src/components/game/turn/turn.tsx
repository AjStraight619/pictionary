import { motion } from "framer-motion";
import {
  useCurrentDrawingPlayer,
  useCurrentRound,
  useGameStatus,
} from "@/hooks/useGameSelector";
import { useTimer } from "@/hooks/useTimer";
import { Clock } from "lucide-react";
import { useWordToGuess } from "@/hooks/useGameSelector";
import Word from "@/components/game/word/word";
import { GameStatus } from "@/types/game";

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const Turn = () => {
  const currentRound = useCurrentRound();
  const currentWord = useWordToGuess();
  const playerDrawing = useCurrentDrawingPlayer();
  const gameStatus = useGameStatus();

  const { timeRemaining } = useTimer({
    timerType: "turnTimer",
    messageTypes: ["turnTimer"],
  });

  if (gameStatus === GameStatus.NotStarted) {
    return null;
  }

  if (!currentWord) {
    if (!playerDrawing) {
      return (
        <div className="flex items-center justify-center h-16 bg-card rounded-lg border shadow-sm">
          <p className="text-muted-foreground">Waiting for next turn...</p>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-16 bg-card rounded-lg border shadow-sm">
        <p className="text-muted-foreground">
          {`${playerDrawing.username} is selecting a word...`}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex items-center justify-center h-16 bg-card rounded-lg border shadow-sm px-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
          <span className="text-xs font-medium">
            Round {currentRound?.count}
          </span>
        </div>

        <Word word={currentWord} />

        <div className="self-end ml-2 text-sm text-muted-foreground">
          {currentWord?.word?.length}
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-muted/30 rounded-full ml-auto">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{timeRemaining}s</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Turn;
