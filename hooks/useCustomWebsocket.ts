import useWebSocket, { Options } from "react-use-websocket";

type UseCustomWebSocketProps = {
  roomId: string;
  userId: string;
  messageType?: string;
  options?: Options;
};

export const useCustomWebSocket = ({
  roomId,
  userId,
  messageType,
  options = {}, // Default to an empty object if no options are provided
}: UseCustomWebSocketProps) => {
  const {
    sendMessage,
    lastMessage,
    readyState,
    sendJsonMessage,
    getWebSocket,
  } = useWebSocket(`ws://localhost:8000/ws/${roomId}?userId=${userId}`, {
    ...options,

    share: true,

    filter(message) {
      // ! Since we have a lot of different countdowns we need to filter on msg.data.timerType if the type of message is countdown
      try {
        const msg = JSON.parse(message.data);
        if (msg.type === "countdown") {
          return msg.data.timerType === messageType;
        }
        return msg.type === messageType;
      } catch (e) {
        // If the message is not valid JSON, ignore it
        return false;
      }
    },
    retryOnError: true,
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: (attemptNumber) => {
      console.log("Attempting to reconnect: ", attemptNumber);
      return Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
    },
    heartbeat: {
      message: "ping",
      returnMessage: "pong",
      timeout: 60000,
      interval: 10000,
    },
  });

  return {
    sendMessage,
    lastMessage,
    readyState,
    sendJsonMessage,
    getWebSocket,
  };
};