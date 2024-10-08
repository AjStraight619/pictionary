'use client';

import { proceedGame } from '@/actions/game';
import { useTimer } from '@/hooks/useTimer';
import { useAnimate } from 'framer-motion';

import { useEffect } from 'react';

type RoundTimerProps = {
  roomId: string;
  newTurn: boolean;
};

export default function RoundTimer({ roomId, newTurn }: RoundTimerProps) {
  const { time, stopTimer } = useTimer({
    messageType: 'round_timer',
    onShouldTimerStop: time => time === 0 || newTurn,
    onTimerStop: async () => {
      stopTimer({
        data: {
          timerType: 'round_timer',
        },
      });

      await proceedGame(roomId);
    },
  });

  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (time === undefined || time > 5) return;
    const animation = () => {
      animate('#target', { scale: [1, 1.5, 1] }, { duration: 1 });
    };
    animation();
  }, [time, animate]);

  return (
    <div ref={scope}>
      <div className="font-sans" id="target">
        {time}
      </div>
    </div>
  );
}
