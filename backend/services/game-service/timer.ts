import { TimerType } from '../../models/game-model.ts';
import { broadcastToGame } from './utils.ts';

const timers = new Map<string, { [key in TimerType]?: number }>();

export const startTimer = (
  gameId: string,
  type: TimerType,
  duration: number,
  callback: () => void,
) => {
  if (!timers.has(gameId)) {
    timers.set(gameId, {});
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

export const stopTimer = (gameId: string, type: TimerType) => {
  const gameTimers = timers.get(gameId);
  if (!gameTimers || !gameTimers[type]) {
    console.log(`No ${type} timer found for game ${gameId}`);
    return;
  }

  clearInterval(gameTimers[type]!);
  delete gameTimers[type];
  console.log(`Stopped ${type} timer for game ${gameId}`);
};
