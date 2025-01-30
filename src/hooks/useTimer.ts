import { useEffect, useState } from "react";
import { useCustomWebsocket } from "./useCustomWebsocket";

type UseTimerOptions = {
  timerType: string;
  messageTypes: string[];
  // Optionally pass a default time or handle it in your parent
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

  // Listen for timer updates from server
  useEffect(() => {
    if (lastMessage) {
      const parsedData = JSON.parse(lastMessage.data);
      const payload = parsedData.payload;
      // Make sure the message is of the correct timer type
      // or the correct message type before updating
      if (payload && typeof payload.timeRemaining === "number") {
        setTimeRemaining(payload.timeRemaining);
      }
    }
  }, [lastMessage]);

  // Start timer on server, providing a timeRemaining if needed
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
    startTimer,
    stopTimer,
  };
};
