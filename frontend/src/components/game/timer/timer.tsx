import { Button } from '@/components/ui/button';
import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';
import React, { useEffect, useState } from 'react';

type TimerProps = {
  duration?: number;
  timerType?: string;
};

const Timer = ({ duration = 60, timerType }: TimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { lastMessage, sendJsonMessage } = useCustomWebsocket({
    messageTypes: ['round-timer-update', 'round-timer-ended'],
  });

  useEffect(() => {
    if (lastMessage) {
      const newTimeRemaining = JSON.parse(lastMessage.data).payload
        .timeRemaining as number;
      setTimeRemaining(newTimeRemaining);
    }
  }, [lastMessage]);

  const startTimer = () => {
    sendJsonMessage({
      type: 'start-timer',
      payload: { duration: 10, timerType: 'round' },
    });
  };

  return (
    <div className="flex flex-row gap-x-2">
      <p>Time: {timeRemaining}</p>
      <Button onClick={() => startTimer()}>Start</Button>
    </div>
  );
};

export default Timer;
