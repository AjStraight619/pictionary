import { motion } from "motion/react";
import { useRevealedLetters } from "@/hooks/useGameSelector";
import { Word as TWord } from "@/types/game";
import { useIsCurrentDrawer } from "@/hooks/useIsCurrentDrawer";

type WordProps = {
  word: TWord;
};

const charFromCode = (code: number | string | undefined): string => {
  if (code == null || code === "_" || code === 95) return "";
  return typeof code === "number" ? String.fromCodePoint(code) : code;
};

const Word = ({ word }: WordProps) => {
  const revealedLetters = useRevealedLetters();
  const isCurrentDrawer = useIsCurrentDrawer();

  return (
    <div className="flex gap-1" data-word-display>
      {Array.from(word.word).map((letter, index) => {
        const visibleLetter = isCurrentDrawer
          ? letter
          : charFromCode(revealedLetters[index]);
        const isSpace = letter === " ";

        return (
          <div
            key={`${word.id}-${index}`}
            className="relative shrink-0"
            style={{ width: isSpace ? "0.4em" : "0.8em", height: "1.5em" }}
          >
            {!isSpace && (
              <>
                <span
                  aria-hidden="true"
                  data-word-underline
                  className="absolute inset-x-0 bottom-0 border-b-2 border-current"
                />
                {visibleLetter && (
                  <motion.span
                    key={visibleLetter}
                    data-word-letter
                    initial={{ opacity: 0, y: isCurrentDrawer ? 0 : -24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`absolute inset-x-0 bottom-1 text-center leading-none ${
                      isCurrentDrawer ? "" : "text-primary font-bold"
                    }`}
                  >
                    {visibleLetter.toLowerCase()}
                  </motion.span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Word;
