import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCustomWebSocket } from './useCustomWebsocket';

type StartTimerMessage = {
  type: string;
  data: {
    time: number;
    timerType: string;
  };
};

type StopTimerMessage = {
  data: {
    timerType: string;
  };
};

type UseTimerOptions = {
  messageType: string;
  onTimerStart?: () => void;
  onShouldTimerStop?: (time: number) => boolean;
  onTimerStop?: () => void;
};

export const useTimer = ({
  messageType,
  onTimerStart,
  onShouldTimerStop,
  onTimerStop,
}: UseTimerOptions) => {
  const [time, setTime] = useState<number | undefined>(undefined);
  const pathname = usePathname();
  const roomId = pathname.split('/').pop()!;
  const { lastMessage, sendJsonMessage } = useCustomWebSocket({
    roomId,
    messageType: messageType,
  });

  const startTimer = useCallback(
    (message: StartTimerMessage) => {
      sendJsonMessage(message);
      if (onTimerStart) {
        onTimerStart();
      }
    },
    [sendJsonMessage, onTimerStart],
  );

  const stopTimer = useCallback(
    (message: StopTimerMessage) => {
      sendJsonMessage(message);
    },
    [sendJsonMessage],
  );

  const timerStopped = useRef(false);

  useEffect(() => {
    if (lastMessage) {
      const msg = JSON.parse(lastMessage.data);

      if (msg.data.time >= 0) {
        setTime(msg.data.time);
        if (onShouldTimerStop && onShouldTimerStop(msg.data.time)) {
          if (!timerStopped.current) {
            timerStopped.current = true;
            onTimerStop?.();
          }
        } else {
          timerStopped.current = false; // Reset when the timer shouldn't stop
        }
      } else {
        setTime(undefined); // Reset time state when the timer is not running
        timerStopped.current = false; // Ensure timerStopped is reset when time is invalid
      }
    }
  }, [lastMessage, onShouldTimerStop, onTimerStop]);

  return { time, startTimer, stopTimer };
};
