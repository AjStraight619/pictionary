'use client';
import { useWord } from '@/context/word-provider';
import { useTimer } from '@/hooks/useTimer';
import { GamePlayer } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type WordDisplayProps = {
  userId: string;
  roomId: string;
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
};

const revealCharVariants = {
  hidden: {
    y: -30,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10,
      duration: 0.5,
    },
  },
};

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const START_REVEAL = 70;
const END_REVEAL = 10;

export default function WordDisplay({
  userId,
  roomId,
  currentDrawerId,
  players,
}: WordDisplayProps) {
  const { word } = useWord();
  const currentDrawingUser = players.find(p => p.playerId === currentDrawerId);

  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const lastRevealTimeRef = useRef<number | null>(null);

  const splitWord = word?.split('');
  const isCurrentDrawingUser = currentDrawingUser?.playerId === userId;

  const { time } = useTimer({
    messageType: 'round_timer',
    onShouldTimerStop: time => time === 0,
    onTimerStop: () => {
      setRevealedIndices(splitWord.map((_, idx) => idx));
    },
  });

  const revealRandomChar = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * splitWord.length);
  }, [splitWord]);

  const revealFirstVowel = useCallback(() => {
    const firstVowelIdx = splitWord.findIndex(ch =>
      VOWELS.includes(ch.toLowerCase()),
    );
    if (firstVowelIdx !== -1) {
      setRevealedIndices(prevIndices => [...prevIndices, firstVowelIdx]);
    }
  }, [splitWord]);

  const revealLastVowel = useCallback(() => {
    const lastVowelIdx = splitWord.findLastIndex(ch =>
      VOWELS.includes(ch.toLocaleLowerCase()),
    );
    if (lastVowelIdx !== -1 && !revealedIndices.includes(lastVowelIdx)) {
      setRevealedIndices(prevIndices => [...prevIndices, lastVowelIdx]);
    } else {
      revealRandomChar();
    }
  }, [splitWord, revealedIndices, revealRandomChar]);

  useEffect(() => {
    if (!splitWord.length || !time || time <= 0) {
      return;
    }

    if (time === START_REVEAL && lastRevealTimeRef.current !== time) {
      console.log('Finding first index...');
      revealFirstVowel();
      lastRevealTimeRef.current = time;
    }

    if (time === END_REVEAL && lastRevealTimeRef.current !== time) {
      console.log('Finding last vowel index...');
      revealLastVowel();
    }
  }, [time, splitWord, revealFirstVowel, revealLastVowel]);

  const renderWordForDrawer = () => (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={container}
      className="flex"
    >
      {splitWord.map((ch, idx) => (
        <motion.li
          key={idx}
          className={`text-3xl -space-y-5 ${ch === ' ' ? 'mx-4' : 'mx-1'}`}
          variants={item}
        >
          <div className="flex flex-col h-20 items-center justify-center leading-[3px]">
            <span className="mb-1 font-sans">{ch !== ' ' ? ch : ' '}</span>
            <span>
              {ch !== ' ' ? (
                <span className="tracking-tighter font-sans leading-[3px] self-end">
                  __
                </span>
              ) : (
                ' '
              )}
            </span>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );

  const renderWordForGuesser = () => (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={container}
      className="flex relative"
    >
      {splitWord.map((ch, idx) => (
        <motion.li
          key={idx}
          className={`text-3xl -space-y-5 ${ch === ' ' ? 'mx-4' : 'mx-1'}`}
          variants={item}
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="flex flex-col items-center justify-center h-20 leading-[3px]"
          >
            <motion.span
              initial="hidden"
              animate={revealedIndices.includes(idx) ? 'show' : 'hidden'}
              variants={revealCharVariants}
              className="mb-1 font-sans"
            >
              {ch !== ' ' && revealedIndices.includes(idx) ? ch : ' '}
            </motion.span>
            <motion.span
              initial="hidden"
              animate="show"
              variants={revealCharVariants}
              className="tracking-tighter font-sans leading-[3px] self-end"
            >
              {ch !== ' ' ? '__' : ' '}
            </motion.span>
          </motion.div>
        </motion.li>
      ))}
    </motion.ul>
  );

  return (
    <div className="bg-white rounded-md p-2 flex items-center gap-x-2">
      {isCurrentDrawingUser ? (
        <>
          <span className="text-2xl mr-4">Draw This:</span>
          {renderWordForGuesser()}
        </>
      ) : (
        <>
          <span>Guess This:</span>
          {renderWordForGuesser()}
        </>
      )}
      <div className="self-end ml-2">{splitWord.length}</div>
    </div>
  );
}

function WordContainer({ children }: { children: ReactNode }) {
  return <div className="relative"></div>;
}
