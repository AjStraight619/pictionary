import { useEffect, useState } from 'react';
import { useCustomWebsocket } from './useCustomWebsocket';

export const useTimer = (timerType: string, messageTypes: string[]) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { lastMessage, sendJsonMessage } = useCustomWebsocket({
    messageTypes: messageTypes,
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
      payload: { timerType: timerType },
    });
  };

  const stopTimer = () => {
    sendJsonMessage({
      type: 'stop-timer',
      payload: { timerType: timerType },
    });
  };

  return {
    timeRemaining,
    startTimer,
    stopTimer,
  };
};
