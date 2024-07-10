'use client';

import useLocalStorage from '@/hooks/useLocalStorage';
import { useTimer } from '@/hooks/useTimer';
import { useAnimate } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

type RoundTimerProps = {
  roomId: string;
};

export default function RoundTimer({ roomId }: RoundTimerProps) {
  const renderRef = useRef(0);
  const { refresh } = useRouter();
  useEffect(() => {
    console.log('Round timer component re rendered: ', renderRef.current++);
  });
  const { time, stopTimer } = useTimer({
    messageType: 'round_timer',
    onShouldTimerStop: time => time === 0,
    onTimerStop: () => {
      localStorage.removeItem('guesses');
      stopTimer({
        data: {
          timerType: 'round_timer',
        },
      });
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
      <div id="target">{time}</div>
    </div>
  );
}
