import { GameState, Player } from '../../models/game-model.ts';

const games = new Map<string, GameState>();

export const initializeGame = (gameId: string): void => {
  const players: Player[] = [];
  games.set(gameId, {
    id: gameId,
    players,
    currentWord: null,
    timers: null,
    rounds: [],
  });
};

export const isCurrentGame = (gameId: string): boolean => games.has(gameId);

export const getGame = (gameId: string): GameState | undefined =>
  games.get(gameId);
