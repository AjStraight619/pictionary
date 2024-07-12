import { GamePlayer, Guess } from '@prisma/client';

type UseGuess = {
  players: GamePlayer[];
  guess: Guess;
};

type UseGuessOptions = {};

export const useGuess = ({ players }: UseGuess) => {};
