import { useEffect, useState } from "react";
import { useCustomWebsocket } from "./useCustomWebsocket";

type UseTimerOptions = {
  timerType: string;
  messageTypes: string[];
  defaultTime?: number | null;
};

export const useTimer = ({
  timerType,
  messageTypes,
  defaultTime = null,
}: UseTimerOptions) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    defaultTime
  );

  const { lastMessage, sendJsonMessage } = useCustomWebsocket({
    messageTypes: messageTypes,
  });

  useEffect(() => {
    if (lastMessage) {
      const parsedData = JSON.parse(lastMessage.data);
      const payload = parsedData.payload;
      if (payload && typeof payload.timeRemaining === "number") {
        setTimeRemaining(payload.timeRemaining);
      }
    }
  }, [lastMessage]);

  const startTimer = () => {
    sendJsonMessage({
      type: "startTimer",
      payload: {
        timerType,
      },
    });
  };

  // Stop timer on server
  const stopTimer = () => {
    sendJsonMessage({
      type: "stopTimer",
      payload: { timerType },
    });
  };

  return {
    timeRemaining,
    setTimeRemaining,
    startTimer,
    stopTimer,
  };
};
