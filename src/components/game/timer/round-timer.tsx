import { useTimer } from '@/hooks/useTimer';
import Timer from './timer';

const RoundTimer = () => {
  const { timeRemaining, startTimer, stopTimer } = useTimer('round', [
    'round-timer-update',
    'round-timer-end',
  ]);

  return <Timer timeRemaining={timeRemaining} />;
};

export default RoundTimer;
