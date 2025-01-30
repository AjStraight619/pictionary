import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

import { useEffect, useState } from "react";

import { motion } from "motion/react";
import { useGame } from "@/providers/game-provider";
import { useTimer } from "@/hooks/useTimer";

const containerVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const letterVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
};

const WordToGuess = () => {
  const [currentWord, setCurrentWord] = useState<string | null>(null);

  const [revealedLetters, setRevealedLetters] = useState<string[]>([]);

  const { isDrawingPlayer } = useGame();

  const { lastMessage } = useCustomWebsocket({
    messageTypes: [
      "selectedWord",
      "revealedLetter",
      "gameState",
      "revealedLetters",
    ],
  });

  const { timeRemaining } = useTimer({
    timerType: "guessWordTimer",
    messageTypes: ["guessWordTimer", "gameState"],
  });

  useEffect(() => {
    if (lastMessage) {
      const newMessage = JSON.parse(lastMessage.data);
      switch (newMessage.type) {
        case "selectedWord":
          setCurrentWord(newMessage.payload.wordToGuess);
          break;
        case "revealedLetter":
          setRevealedLetters((prev) => [
            ...prev,
            newMessage.payload.revealedLetter,
          ]);
          break;
        case "gameState":
          {
            const revealedLetters =
              newMessage.payload.gameState.revealedLetters.map((code: number) =>
                String.fromCharCode(code)
              );
            setRevealedLetters(revealedLetters);
            const word = newMessage.payload.gameState.wordToGuess;
            setCurrentWord(word);
          }
          break;

        default:
          return;
      }
    }
  }, [lastMessage]);

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex flex-row items-center space-x-2 border rounded-xl p-4"
    >
      {currentWord &&
        currentWord.split("").map((letter, index) => (
          <motion.span
            key={`${letter}-${index}`}
            variants={letterVariants}
            className="text-xl font-bold m-0 p-0"
          >
            <div
              className="flex flex-col items-center justify-center m-0 p-0"
              style={{
                height: "2em", // Fixed height to prevent layout shifts
                position: "relative",
              }}
            >
              <span
                className="leading-none m-0 p-0"
                style={{ position: "absolute", top: 0 }}
              >
                {isDrawingPlayer ? (
                  <>{letter.toLowerCase()}</>
                ) : (
                  <>{revealedLetters[index]?.toLowerCase() || "\u00A0"}</>
                )}
              </span>
              {letter !== " " && (
                <span className="leading-none m-0 p-0">_</span>
              )}
            </div>
          </motion.span>
        ))}

      <div className="self-end">{currentWord?.length}</div>

      <div>{timeRemaining}</div>
    </motion.div>
  );
};

export default WordToGuess;
