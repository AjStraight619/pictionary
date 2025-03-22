import { useEffect, useRef } from 'react';
import { useAnimate } from 'motion/react';

type TimerProps = {
  timeRemaining: number | null;
  className?: string;
};

const Timer = ({ timeRemaining, className }: TimerProps) => {
  const [scope, animate] = useAnimate();
  const prevTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      timeRemaining !== null &&
      timeRemaining <= 5 &&
      timeRemaining >= 0 &&
      timeRemaining !== prevTimeRef.current
    ) {
      // Trigger scale animation
      animate(
        scope.current,
        { scale: [1, 1.5, 1] },
        { duration: 0.5, ease: 'easeInOut' },
      );
    }
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining, animate, scope]);

  return (
    <p ref={scope} className={className}>
      {timeRemaining}
    </p>
  );
};

export default Timer;
