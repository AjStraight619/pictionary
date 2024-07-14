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
};

// const containerVariants = {
//   visible: {
//     opacity: 1,
//     transition: {
//       when: 'beforeChildren',
//       staggerChildren: 0.3,
//     },
//   },
//   hidden: {
//     opacity: 0,
//     transition: {
//       when: 'afterChildren',
//     },
//   },
// };

// const itemVariants = {
//   hidden: { opacity: 0, y: -10 },
//   visible: { opacity: 1, y: 0 },
//   exit: { opacity: 0, y: 10 },
// };

export default function WordList({
  newTurn,
  roundId,
  roomId,
  userId,
  status,
}: WordListProps) {
  const [wordList, setWordList] = useState<SelectableWord[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [scope, animate] = useAnimate();
  const [isWordSelected, setIsWordSelected] = useState(false);

  const { time, startTimer, stopTimer } = useTimer({
    messageType: 'select_word_countdown',
    onShouldTimerStop: time => time === 0 || isWordSelected,
    onTimerStop: () => {
      console.log('Timer stopped');
      if (!isWordSelected) {
        selectRandomWord();
      }
    },
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

  const selectRandomWord = () => {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const randomWord = wordList[randomIndex];
    handleWordSelect(randomWord);
  };

  if (status === 'WAITING' || status === 'FINISHED') return null;

  return (
    <Dialog open={newTurn}>
      <DialogContent>
        <div className="absolute top-2 right-2 flex items-center gap-x-2">
          <div>{time}</div>
          <Button onClick={() => getNewWords()}>New Words</Button>
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl">Select A Word</DialogTitle>
          <DialogDescription className="font-roboto">
            It is your turn to draw, select a word!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={e => e.preventDefault()}>
          <ul
            ref={scope}
            className="flex flex-row items-center justify-evenly text-lg"
          >
            {wordList.map(word => (
              <li id={word.id} key={word.id}>
                <WordSelect
                  onSelect={handleWordSelect}
                  inputRef={inputRef}
                  word={word}
                />
              </li>
            ))}
          </ul>
        </form>
      </DialogContent>
    </Dialog>
  );
}
