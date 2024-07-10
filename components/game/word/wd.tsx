'use client';
import { GamePlayer } from '@prisma/client';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { useWord } from '@/context/word-provider';
import { useTimer } from '@/hooks/useTimer';
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
};

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const FIRST_REVEAL = 70;
const LAST_REVEAL = 10;

export default function WordDisplay({
  userId,
  roomId,
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

  const maxReveal = useMemo(() => {
    if (!splitWord) return;
    if (splitWord.length <= 5) {
      return 2;
    }
    if (splitWord.length <= 8) {
      return 3;
    }
    return 4;
  }, [splitWord]);

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
    if (!maxReveal) return;
    const randomIdx = Math.floor(Math.random() * splitWord?.length);
    if (
      !revealedIndices.includes(randomIdx) &&
      revealedIndices.length < maxReveal
    ) {
      setRevealedIndices(prevIndices => [...prevIndices, randomIdx]);
    }
  }, [splitWord, revealedIndices, maxReveal]);

  const isSmallWord = () => splitWord?.length <= 4;
  const isMediumWord = () => splitWord?.length > 4 && splitWord?.length <= 8;
  const isLargeWord = () => splitWord?.length > 8;
  // const containsVowel = useCallback(() => {
  //   return splitWord?.findIndex((_, idx) => idx === revealedIndices[idx]);
  // }, [splitWord]);

  useEffect(() => {
    if (!time || time === 0) return;

    if (time === FIRST_REVEAL && lastRevealTimeRef.current !== time) {
      revealFirstVowel();
      lastRevealTimeRef.current = time;
    }

    if (time === LAST_REVEAL && lastRevealTimeRef.current !== time) {
      revealLastVowel();
      lastRevealTimeRef.current = time;
    }

    if (
      time < FIRST_REVEAL &&
      time > LAST_REVEAL &&
      lastRevealTimeRef.current !== time
    ) {
      if (time === 50 || time === 35 || time === 20) revealRandomLetter();
      lastRevealTimeRef.current = time;
    }
  }, [revealFirstVowel, revealLastVowel, revealRandomLetter, time, splitWord]);

  const renderWordForGuesser = () => {
    return (
      <>
        <div className="text-2xl mr-2">Guess This:</div>
        <motion.ul
          className="flex items-center gap-x-2 text-3xl mr-4"
          animate="show"
          initial="hidden"
          variants={container}
        >
          {splitWord?.map((ch, idx) => (
            <motion.li
              variants={item}
              className="flex flex-col items-center leading-[2px] gap-y-1 h-fit"
              key={idx}
            >
              <motion.span
                variants={revealCharVariants}
                animate={revealedIndices.includes(idx) ? 'show' : 'hidden'}
                initial="hidden"
              >
                {ch !== ' ' && revealedIndices.includes(idx) ? ch : ' '}
              </motion.span>
              <span
                className={`tracking-tighter font-sans leading-[1px] ${
                  revealedIndices.includes(idx) && 'mb-[1px]'
                }`}
              >
                {ch !== ' ' ? '__' : <span>&nbsp;&nbsp;</span>}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </>
    );
  };

  return (
    <WordContainer>
      {isCurrentDrawer ? <>{renderWordForGuesser()}</> : null}
      <div className="absolute bottom-1 right-1">{splitWord?.length}</div>
    </WordContainer>
  );
}

function WordContainer({ children }: { children: ReactNode }) {
  return (
    <motion.div className="relative flex gap-x-2 bg-white rounded-md p-4 items-center">
      {children}
    </motion.div>
  );
}
