import { getGame } from './game.ts';

export const startNewRound = (gameId: string) => {
  const game = getGame(gameId);
  if (!game) return;
};
