import { motion, AnimatePresence } from "framer-motion";
import { useRevealedLetters } from "@/hooks/useGameSelector";
import { Word as TWord } from "@/types/game";
import { useIsCurrentDrawer } from "@/hooks/useIsCurrentDrawer";
import { useEffect, useState } from "react";

// Animation variants
const letterVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

const revealVariants = {
  initial: { scale: 1.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

type WordProps = {
  word: TWord;
};

const Word = ({ word }: WordProps) => {
  const revealedLetters = useRevealedLetters();
  const isCurrentDrawer = useIsCurrentDrawer();
  const [prevRevealedCount, setPrevRevealedCount] = useState(0);
  const [recentlyRevealed, setRecentlyRevealed] = useState<number[]>([]);

  useEffect(() => {
    if (!isCurrentDrawer) {
      // Count non-underscore characters
      const currentRevealedCount = revealedLetters.filter(
        (l) => l !== "_"
      ).length;

      // If we have more revealed letters than before
      if (currentRevealedCount > prevRevealedCount) {
        // Find which indices were newly revealed
        const newIndices: number[] = [];
        revealedLetters.forEach((letter, idx) => {
          // If this letter is revealed and wasn't before
          if (
            letter !== "_" &&
            (idx >= revealedLetters.length ||
              recentlyRevealed.indexOf(idx) === -1)
          ) {
            newIndices.push(idx);
          }
        });

        // Set the newly revealed indices
        setRecentlyRevealed(newIndices);

        // Clear the highlighting after a delay
        const timer = setTimeout(() => {
          setRecentlyRevealed([]);
        }, 2000);

        setPrevRevealedCount(currentRevealedCount);
        return () => clearTimeout(timer);
      }
    }
  }, [revealedLetters, isCurrentDrawer, prevRevealedCount, recentlyRevealed]);

  return (
    <div className="flex space-x-1">
      {word.word.split("").map((letter, index) => (
        <motion.div
          key={`${letter}-${index}`}
          variants={letterVariants}
          className="relative"
        >
          <div
            className="flex flex-col items-center justify-center m-0 p-0"
            style={{
              height: "2em",
              position: "relative",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isCurrentDrawer ? letter : revealedLetters[index]}
                variants={
                  recentlyRevealed.includes(index)
                    ? revealVariants
                    : letterVariants
                }
                initial="initial"
                animate="animate"
                exit="exit"
                className={`leading-none m-0 p-0 ${
                  recentlyRevealed.includes(index)
                    ? "text-yellow-300 font-bold"
                    : ""
                }`}
                style={{ position: "absolute", top: 0 }}
              >
                {isCurrentDrawer ? (
                  <>{letter.toLowerCase()}</>
                ) : (
                  <>{revealedLetters[index]?.toLowerCase() || "\u00A0"}</>
                )}
              </motion.span>
            </AnimatePresence>
            {letter !== " " && <span className="leading-none m-0 p-0">_</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Word;
