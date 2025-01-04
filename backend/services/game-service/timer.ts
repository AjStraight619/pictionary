import { logError } from './../../utils.ts';
import { getGame } from './game.ts';
import { TimerType } from '../../models/game-model.ts';
import { broadcastToGame } from './utils.ts';

const timers = new Map<string, { [key in TimerType]?: number }>();

export const startTimer = (
  gameId: string,
  type: TimerType,
  callback: () => void,
) => {
  if (!timers.has(gameId)) {
    timers.set(gameId, {});
  }

  const game = getGame(gameId);

  if (!game) return;

  let duration: number = 0;

  if (type === 'round') {
    duration = game.roundTime;
  } else if (type === 'word-select') {
    duration = game.wordSelectTime;
  } else {
    logError('Unknown timer type');
    return;
  }

  const gameTimers = timers.get(gameId)!;

  if (gameTimers[type]) {
    console.log(`Timer of type ${type} already running for game ${gameId}`);
    return;
  }

  console.log(`Starting ${type} timer for game ${gameId}`);

  const intervalId = setInterval(() => {
    duration--;

    broadcastToGame(gameId, {
      type: `${type}-timer-update`,
      payload: { timeRemaining: duration },
    });

    if (duration <= 0) {
      clearInterval(intervalId);
      delete gameTimers[type];
      console.log(`Timer of type ${type} for game ${gameId} ended`);
      callback();
    }
  }, 1000);

  gameTimers[type] = intervalId;
};

export const stopTimer = (
  gameId: string,
  type: TimerType,
  callback?: () => void,
) => {
  const gameTimers = timers.get(gameId);
  if (!gameTimers || !gameTimers[type]) {
    console.log(`No ${type} timer found for game ${gameId}`);
    return;
  }

  clearInterval(gameTimers[type]!);
  delete gameTimers[type];
  console.log(`Stopped ${type} timer for game ${gameId}`);
  if (callback) callback();
};

export const getGameTimers = (gameId: string) => {
  const gameTimers = timers.get(gameId);

  if (!gameTimers) {
    console.log(`No timers found for game ${gameId}`);
    return null;
  }

  return gameTimers;
};
