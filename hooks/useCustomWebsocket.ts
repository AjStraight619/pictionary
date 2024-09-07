import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import useWebSocket, { Options, ReadyState } from 'react-use-websocket';

type UseCustomWebSocketProps = {
  roomId: string;
  userId?: string;
  messageType?: string;
  options?: Options;
};

// const WSURL =
//   process.env.NODE_ENV === "development"
//     ? "ws://localhost:8000/ws"
//     : process.env.WS_URL!;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

export const useCustomWebSocket = ({
  roomId,
  userId,
  messageType,
  options = {}, // Default to an empty object if no options are provided
}: UseCustomWebSocketProps) => {
  const { push } = useRouter();
  const didUnmount = useRef(false);
  const {
    sendMessage,
    lastMessage,
    readyState,
    sendJsonMessage,
    getWebSocket,
  } = useWebSocket(`${WS_URL}/${roomId}?userId=${userId}`, {
    ...options,

    share: true, // Share this connection between components

    // ! Filter message to prevent unnecessary re-renders
    filter(message) {
      try {
        const msg = JSON.parse(message.data);
        if (msg.type === 'countdown') {
          return msg.data.timerType === messageType;
        }
        if (msg.type === 'chat') {
          console.log('Chat message recieved');
        }
        return msg.type === messageType;
      } catch (e) {
        // If the message is not valid JSON, ignore it
        return false;
      }
    },
    retryOnError: true,

    reconnectAttempts: 10,
    reconnectInterval: attemptNumber => {
      console.log('Attempting to reconnect: ', attemptNumber); // ? Not logging out the correct number?
      return Math.min(Math.pow(2, attemptNumber) * 1000, 10000); // Exponential backoff
    },

    heartbeat: {
      message: 'ping',
      returnMessage: 'pong',
      timeout: 60000, // 1 min
      interval: 10000, // 10 sec
    },

    onReconnectStop: () => {
      console.log('Reconnection attempts have stopped');
      push(
        `/disconnected/${roomId}?userId=${userId}&reason=reconnection_failed`,
      );
    },
    onClose: event => {
      console.log('Websocket connection is closed: ', event.reason);

      push(`/disconnected/${roomId}?userId=${userId}&reason=${event.reason}`);
    },
    shouldReconnect: closeEvent => {
      if (didUnmount.current) {
        return false; // Don't reconnect if the component is unmounted
      }
      if (closeEvent.code === 1000) {
        console.log('WebSocket closed normally.');
        return false; // Normal closure, no need to reconnect
      }
      if (closeEvent.code === 1006) {
        console.log('WebSocket closed abnormally. Reconnecting...');
        return true; // Unexpected disconnection, try to reconnect
      }
      return true; // Other closures, attempt to reconnect
    },
  });

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    console.log('Connection status: ', connectionStatus);
  }, [connectionStatus]);

  useEffect(() => {
    return () => {
      didUnmount.current = true;
    };
  }, []);

  return {
    sendMessage,
    lastMessage,
    readyState,
    sendJsonMessage,
    getWebSocket,
  };
};
