'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWord } from '@/context/word-provider';
import { useCustomWebSocket } from '@/hooks/useCustomWebsocket';
import { getRandomWords } from '@/lib/words';
import { useEffect, useRef, useState } from 'react';
import WordSelect from './word-select';
import {
  motion,
  AnimatePresence,
  useAnimate,
  usePresence,
} from 'framer-motion';
import { SelectableWord } from '@/types/word';
import { wait } from '@/lib/utils';
import { useTimer } from '@/hooks/useTimer';
import { GameStatus } from '@prisma/client';

type WordListProps = {
  status: GameStatus;
  newTurn: boolean;
  roundId: string;
  userId: string;
  roomId: string;
  usedWords: string[];
};

const container = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  show: {
    opacity: 1,
    y: 20,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
  },
};

export default function WordList({
  newTurn,
  roundId,
  roomId,
  userId,
  status,
  usedWords,
}: WordListProps) {
  const [wordList, setWordList] = useState<SelectableWord[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [scope, animate] = useAnimate();
  const [isWordSelected, setIsWordSelected] = useState(false);

  console.log('New Turn?: ', newTurn);

  const { time, startTimer, stopTimer } = useTimer({
    messageType: 'select_word_countdown',
    onShouldTimerStop: time => time === 0 || isWordSelected,
    // onTimerStop: () => {
    //   console.log('Timer stopped');
    //   if (!isWordSelected) {
    //     selectRandomWord();
    //   }
    // },
  });

  const { updateWord } = useWord();

  const { sendJsonMessage } = useCustomWebSocket({
    roomId,
    userId,
  });

  useEffect(() => {
    setIsWordSelected(false);
    getNewWords();
    startTimer({
      type: 'countdown',
      data: {
        time: 30,
        timerType: 'select_word_countdown',
      },
    });
  }, [newTurn, startTimer]);

  const getNewWords = () => {
    setWordList(getRandomWords('Random', 3));
  };

  const handleWordSelect = async (word: SelectableWord) => {
    setWordList([word]);
    setIsWordSelected(true);
    const selectedElement = document.getElementById(word.id);
    if (selectedElement) {
      await animate(
        selectedElement,
        { rotate: 360, scale: [1.4, 1.0] },
        { duration: 0.5 },
      );
    }
    const formData = new FormData();
    formData.append('word', word.word);
    handleSelectedWord(formData);
  };

  const handleSelectedWord = async (formData: FormData) => {
    formData.append('roundId', roundId);
    updateWord(formData);
    stopTimer({
      data: {
        timerType: 'select_word_countdown',
      },
    });
    await wait(2000);
    sendJsonMessage({
      type: 'countdown',
      data: {
        timerType: 'round_timer',
        time: 80,
      },
    });
  };

  if (status === 'WAITING' || status === 'FINISHED') return null;

  return (
    <Dialog open={newTurn}>
      <DialogContent>
        <div className="absolute top-2 right-2 flex items-center gap-x-2">
          <div className="font-sans">{time}</div>
          <Button onClick={() => getNewWords()}>New Words</Button>
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl">Select A Word</DialogTitle>
          <DialogDescription className="font-roboto">
            It is your turn to draw, select a word!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={e => e.preventDefault()}>
          <motion.ul
            ref={scope}
            className="flex flex-row items-center justify-evenly text-lg flex-wrap"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {wordList.map(word => (
              <motion.li variants={item} id={word.id} key={word.id}>
                <WordSelect
                  onSelect={handleWordSelect}
                  inputRef={inputRef}
                  word={word}
                />
              </motion.li>
            ))}
          </motion.ul>
        </form>
      </DialogContent>
    </Dialog>
  );
}
