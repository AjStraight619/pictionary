import { useEffect, useState } from "react";
import { useCustomWebsocket } from "./useCustomWebsocket";
import { MessagePayloadMap } from "@/types/messages";

type UseTimerOptions = {
  timerType: string;
  messageTypes: Array<keyof MessagePayloadMap>;
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

  const [isStarting, setIsStarting] = useState(false);
  const { lastMessage, sendJsonMessage, readyState } = useCustomWebsocket({
    messageTypes: [...messageTypes, "gameState"],
  });

  useEffect(() => {
    if (lastMessage) {
      const parsedData = JSON.parse(lastMessage.data);
      const payload = parsedData.payload;
      if (parsedData.type === "gameState") {
        setTimeRemaining(payload.timers?.[timerType] ?? null);
        setIsStarting(false);
      } else if (payload && (typeof payload.timeRemaining === "number" || payload.timeRemaining === null)) {
        setTimeRemaining(payload.timeRemaining);
        setIsStarting(false);
      }
    }
  }, [lastMessage, timerType]);

  useEffect(() => {
    if (readyState !== 1) setIsStarting(false);
  }, [readyState]);

  const startTimer = () => {
    if (readyState !== 1 || isStarting) return;
    setIsStarting(true);
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
    isStarting,
    isConnected: readyState === 1,
    timeRemaining,
    setTimeRemaining,
    startTimer,
    stopTimer,
  };
};
