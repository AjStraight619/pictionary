'use client';
import { addWordToUsedList, setWordForRound } from '@/actions/word';
import {
  ReactNode,
  createContext,
  useContext,
  useOptimistic,
  useState,
} from 'react';

type WordContextType = {
  updateWord: (formData: FormData) => void;
  word: string;
};

type WordProviderProps = {
  children: ReactNode;
  newWord: string;
  gameId: string;
};

const WordContext = createContext<WordContextType | null>(null);

export default function WordProvider({
  children,
  newWord,
  gameId,
}: WordProviderProps) {
  const updateWord = async (formData: FormData) => {
    const roundId = formData.get('roundId') as string;
    const word = formData.get('word') as string;
    await setWordForRound(gameId, roundId, word);
    Promise.all([
      setWordForRound(gameId, roundId, word),
      addWordToUsedList(gameId, word),
    ]);
  };

  return (
    <WordContext.Provider value={{ word: newWord, updateWord }}>
      {children}
    </WordContext.Provider>
  );
}

export const useWord = () => {
  const context = useContext(WordContext);
  if (!context) {
    throw new Error('Custom hook useWord must be used within WordProvider');
  }
  return context;
};
