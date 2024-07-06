import { useCallback, useEffect, useState } from "react";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

type UseTimerOptions = {
  sendJsonMessage: SendJsonMessage;
  lastMessage: MessageEvent<any> | null;
  onShouldStopTimer?: (time: number | undefined) => boolean;
  timerType: string;
};

export const useTimer = ({
  sendJsonMessage,
  lastMessage,
  onShouldStopTimer,
  timerType,
}: UseTimerOptions) => {
  const [time, setTime] = useState<number | undefined>(undefined);

  const stopTimer = useCallback(() => {
    if (sendJsonMessage) {
      sendJsonMessage({
        type: "stop_timer",
        data: {
          timerType,
        },
      });
    }
  }, [sendJsonMessage, timerType]);

  const startTimer = useCallback(
    (initialTime: number) => {
      sendJsonMessage({
        type: "start_timer",
        data: {
          time: initialTime,
          timerType,
        },
      });
    },
    [sendJsonMessage, timerType]
  );

  useEffect(() => {
    if (lastMessage) {
      const msg = JSON.parse(lastMessage.data);
      if (msg.data.timerType === timerType) {
        setTime(msg.data.time);
      }
    }
  }, [lastMessage, timerType]);

  useEffect(() => {
    if (onShouldStopTimer && onShouldStopTimer(time)) {
      stopTimer();
    }
  }, [time, onShouldStopTimer, stopTimer]);

  return { time, startTimer, stopTimer };
};
