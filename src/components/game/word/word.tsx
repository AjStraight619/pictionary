import { motion } from "framer-motion";
import { useRevealedLetters, useCurrentDrawer } from "@/hooks/useGameSelector";
import { Word as TWord } from "@/types/game";

// Animation variants
const letterVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
type WordProps = {
  word: TWord;
};
const Word = ({ word }: WordProps) => {
  const revealedLetters = useRevealedLetters();
  const isCurrentDrawer = useCurrentDrawer();

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
            <span
              className="leading-none m-0 p-0"
              style={{ position: "absolute", top: 0 }}
            >
              {isCurrentDrawer ? (
                <>{letter.toLowerCase()}</>
              ) : (
                <>{revealedLetters[index]?.toLowerCase() || "\u00A0"}</>
              )}
            </span>
            {letter !== " " && <span className="leading-none m-0 p-0">_</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Word;
