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

export const removeGameById = (gameId: string, delayed = true) => {
  const game = getGame(gameId);

  if (!game) {
    console.log(`Game ${gameId} not found`);
    return;
  }

  if (delayed) {
    if (game.timers?.cleanup) {
      console.log(`Cleanup timer already running for game ${gameId}`);
      return;
    }

    console.log(`Starting cleanup timer for game ${gameId}`);
    const cleanupTimer = setTimeout(() => {
      clearAllGameTimers(gameId); // Clear timers before deleting
      games.delete(gameId);
      console.log(`Game ${gameId} deleted after cleanup timeout.`);
    }, 20000); // 20 seconds

    if (!game.timers) {
      game.timers = {};
    }
    game.timers.cleanup = cleanupTimer;
  } else {
    // Immediate removal
    clearAllGameTimers(gameId); // Clear timers before deleting
    games.delete(gameId);
    console.log(`Game ${gameId} deleted immediately.`);
  }
};

export const clearAllGameTimers = (gameId: string) => {
  const game = getGame(gameId);
  if (!game || !game.timers) return;

  Object.keys(game.timers).forEach((key) => {
    const timerType = key as keyof typeof game.timers;
    const timerId = game.timers![timerType];
    if (timerId) {
      clearTimeout(timerId); // Clear timeouts (e.g., cleanup)
      clearInterval(timerId); // Clear intervals (e.g., round or word-select timers)
      console.log(`Cleared ${timerType} timer for game ${gameId}`);
    }
  });

  game.timers = null; // Reset timers to null after clearing
};

export const getAllGames = () => {
  return games;
};

export const updateGameOptions = (gameId: string, options: GameOptions) => {
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
};
