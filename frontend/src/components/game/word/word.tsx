import { motion, AnimatePresence } from "framer-motion";
import { useRevealedLetters } from "@/hooks/useGameSelector";
import { Word as TWord } from "@/types/game";
import { useIsCurrentDrawer } from "@/hooks/useIsCurrentDrawer";

// Animation variants
const letterVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

// Letter reveal animation
const revealVariants = {
  initial: { scale: 1.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

type WordProps = {
  word: TWord;
};

// Helper function to convert character code to string
const charFromCode = (code: number | string): string => {
  if (typeof code === "number") {
    // Convert number to character
    return String.fromCharCode(code);
  }
  return code;
};

const isHidden = (letter: string | number): boolean => {
  return letter === "_" || letter === 95;
};

const Word = ({ word }: WordProps) => {
  const revealedLetters = useRevealedLetters();
  const isCurrentDrawer = useIsCurrentDrawer();

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
                  !isHidden(revealedLetters[index]) && !isCurrentDrawer
                    ? revealVariants
                    : letterVariants
                }
                initial="initial"
                animate="animate"
                exit="exit"
                className={`leading-none m-0 p-0 ${
                  !isHidden(revealedLetters[index]) && !isCurrentDrawer
                    ? "text-yellow-300 font-bold"
                    : ""
                }`}
                style={{ position: "absolute", top: 0 }}
              >
                {isCurrentDrawer ? (
                  <>{letter.toLowerCase()}</>
                ) : (
                  <>
                    {charFromCode(revealedLetters[index])?.toLowerCase() ||
                      "\u00A0"}
                  </>
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
