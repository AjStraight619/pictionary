import { GameState, Player } from "../../models/game-model.ts";
import { addPlayer } from "./player.ts";
import { broadcastToGame } from "./utils.ts";

const games = new Map<string, GameState>();

type GameOptions = {
  maxRounds: number;
  roundTime: number;
  wordSelectTime: number;
};

export const initializeGame = (gameId: string): void => {
  const players: Player[] = [];

  const defaultOptions: GameOptions = {
    maxRounds: 8,
    roundTime: 60,
    wordSelectTime: 20,
  };

  games.set(gameId, {
    id: gameId,
    players,
    currentWord: null,
    timers: null,
    rounds: [],
    status: "initial",
    ...defaultOptions,
  });
};

export const isCurrentGame = (gameId: string): boolean => games.has(gameId);

export const getGame = (gameId: string): GameState | undefined =>
  games.get(gameId);

export const removeGame = (gameId: string) => {
  if (games.has(gameId)) {
    games.delete(gameId);
  }
};

export const getAllGames = () => {
  return games;
};

export const updateGameOptions = (gameId: string, options?: GameOptions) => {
  const game = getGame(gameId);
  if (!game) return;
  const updatedGame = { ...game, ...options };
  games.set(gameId, updatedGame);
};

export const initializeGameWithLeader = (
  gameId: string,
  player: Player,
  gameOptions: GameOptions,
) => {
  if (isCurrentGame(gameId)) {
    return {
      error: "Game already exists",
    };
  }

  games.set(gameId, {
    id: gameId,
    players: [],
    currentWord: null,
    timers: null,
    rounds: [],
    status: "initial",
    ...gameOptions,
  });

  addPlayer(gameId, player);

  broadcastToGame(gameId, {
    type: "initial-game-state",
    payload: games.get(gameId),
  });
};
