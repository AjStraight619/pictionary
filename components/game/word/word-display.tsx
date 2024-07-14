'use client';
import { GamePlayer } from '@prisma/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWord } from '@/context/word-provider';
import { useTimer } from '@/hooks/useTimer';
type WordDisplayProps = {
  currentDrawerId: string | null;
  players: GamePlayer[];
};
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -50 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    },
  },
};

const revealCharVariants = {
  hidden: {
    y: -50,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.5,
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: {
    y: 50,
    opacity: 0,
    transition: {
      type: 'spring',
      bounce: 0.5,
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
};

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const FIRST_REVEAL = 70;
const RANDOM_REVEAL = 50 || 25;
const LAST_REVEAL = 10;

export default function WordDisplay({
  currentDrawerId,
  players,
}: WordDisplayProps) {
  const { word } = useWord();
  const splitWord = word?.split('');
  const lastRevealTimeRef = useRef<number | null>(null);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const isCurrentDrawer = players.find(p => p.playerId === currentDrawerId);
  const renderRef = useRef(0);

  useEffect(() => {
    console.log('Word Display component re rendered: ', renderRef.current++);
  });

  const { time } = useTimer({
    messageType: 'round_timer',
    onShouldTimerStop: time => time === 0,
    onTimerStop: () => {
      setRevealedIndices(splitWord?.map((_, idx) => idx));
    },
  });

  const revealFirstVowel = useCallback(() => {
    const firstVowelIdx = splitWord.findIndex(ch => VOWELS.includes(ch));
    if (firstVowelIdx !== -1) {
      setRevealedIndices(prevIndices => [...prevIndices, firstVowelIdx]);
    }
  }, [splitWord]);

  const revealLastVowel = useCallback(() => {
    const lastVowelIdx = splitWord.findLastIndex(ch => VOWELS.includes(ch));
    if (lastVowelIdx !== -1) {
      setRevealedIndices(prevIndices => [...prevIndices, lastVowelIdx]);
    }
  }, [splitWord]);

  const revealRandomLetter = useCallback(() => {
    if (splitWord.length <= 8) return;
    const randomIdx = Math.floor(Math.random() * splitWord.length);
    if (!revealedIndices.includes(randomIdx)) {
      setRevealedIndices(prevIndices => [...prevIndices, randomIdx]);
    }
  }, [splitWord, revealedIndices]);

  useEffect(() => {
    if (!time || time === 0) return;

    if (time === FIRST_REVEAL && lastRevealTimeRef.current !== time) {
      revealFirstVowel();
      lastRevealTimeRef.current = time;
    }

    if (time === RANDOM_REVEAL && lastRevealTimeRef.current !== time) {
      revealRandomLetter();
      lastRevealTimeRef.current = time;
    }

    if (time === LAST_REVEAL && lastRevealTimeRef.current !== time) {
      revealLastVowel();
      lastRevealTimeRef.current = time;
    }
  }, [revealFirstVowel, revealLastVowel, revealRandomLetter, time, splitWord]);

  const renderWord = (label: string, revealAll: boolean = false) => (
    <div className="relative flex gap-x-2 h-full items-center">
      <motion.div
        initial={{
          x: -10,
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
        }}
        className="text-2xl mr-2"
      >
        {label}
      </motion.div>
      <AnimatePresence>
        <motion.ul
          key={word}
          initial="hidden"
          animate="show"
          exit="exit"
          variants={container}
          className="flex items-center gap-x-2 text-3xl mr-4"
        >
          {splitWord?.map((ch, idx) => (
            <motion.li
              variants={item}
              // exit="exit"
              className="flex flex-col items-center leading-[2px] gap-y-1 h-fit font-sans"
              key={idx}
            >
              <motion.span
                variants={revealCharVariants}
                animate={
                  revealAll || revealedIndices.includes(idx) ? 'show' : 'hidden'
                }
                initial="hidden"
                // exit="exit"
              >
                {ch !== ' ' && (revealAll || revealedIndices.includes(idx))
                  ? ch
                  : ' '}
              </motion.span>
              <span
                className={`tracking-tighter font-sans leading-[1px] ${
                  revealAll || revealedIndices.includes(idx) ? 'mb-[1px]' : ''
                }`}
              >
                {ch !== ' ' ? '__' : <span>&nbsp;&nbsp;</span>}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
      {splitWord?.length !== 0 && (
        <motion.div
          // initial={{
          //   opacity: 0,
          //   y: -30,
          // }}
          // animate={{
          //   opacity: 1,
          //   y: 0,
          // }}
          // transition={{
          //   duration: 0.3,
          //   type: 'spring',
          //   damping: 5,
          //   stiffness: 20,
          // }}
          className="self-end"
        >
          {splitWord.length}
        </motion.div>
      )}
    </div>
  );

  const renderWordForGuesser = () => renderWord('Guess This:');

  const renderWordForDrawer = () => renderWord('Draw This:', true);

  return (
    <>{isCurrentDrawer ? renderWordForDrawer() : renderWordForGuesser()}</>
  );
}
