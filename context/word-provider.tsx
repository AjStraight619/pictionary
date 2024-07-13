'use client';
import { setWordForRound } from '@/actions/word';
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
  // const [word, addOptimisticWord] = useOptimistic(newWord);
  const updateWord = async (formData: FormData) => {
    const roundId = formData.get('roundId') as string;
    const word = formData.get('word') as string;
    // addOptimisticWord(word);
    await setWordForRound(gameId, roundId, word);
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
