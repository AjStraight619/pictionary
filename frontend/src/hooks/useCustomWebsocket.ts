import { on } from 'events';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { useLocalStorage } from 'usehooks-ts';

type QueryParams = {
  [key: string]: string | number; // Allows any string key with values of type string or number
};

type UseCustomWebsocketArgs = {
  messageTypes: string[];
  url?: string;
  gameId?: string;
  queryParams?: QueryParams;
};

type PlayerInfo = {
  playerId: string;
  name: string;
};

export const useCustomWebsocket = ({
  messageTypes,
  queryParams,
}: UseCustomWebsocketArgs) => {
  // const [playerId, setPlayerId] = useLocalStorage('playerId', '');

  const [playerInfo] = useLocalStorage<PlayerInfo | null>('playerInfo', null);

  const [shouldReconnect, setShouldReconnect] = useState(true);

  const playerId = playerInfo?.playerId as string;
  const playerName = playerInfo?.name as string;

  const { id } = useParams();

  const augmentedQueryParams = { ...queryParams, playerId, playerName };

  const { sendJsonMessage, lastMessage, readyState, getWebSocket } =
    useWebSocket(`ws://localhost:8000/game/${id}`, {
      queryParams: augmentedQueryParams,
      share: true,
      shouldReconnect: closeEvent => {
        return shouldReconnect;
      },
      reconnectAttempts: 3,
      // Exponential backoff reconnect strategy
      reconnectInterval: attemptNumber => {
        console.log('Attempting to reconnect for the ', attemptNumber, ' time');
        return Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
      },
      onOpen: () => console.log('opened: ', new Date().toLocaleTimeString()),
      onClose: () => console.log('closed: ', new Date().toLocaleTimeString()),
      onError: error => console.log('error: ', error),
      onReconnectStop: () =>
        console.log('reconnect stopped', new Date().toLocaleTimeString()),
      heartbeat: {
        timeout: 60000,
        interval: 10000,
        message: 'ping',
        returnMessage: 'pong',
      },
      filter: message => {
        if (message.data === 'pong') {
          return false;
        }

        const newMessage = JSON.parse(message.data);

        // Allow messages of any type in `messageTypes`
        if (!messageTypes.includes(newMessage.type)) {
          return false;
        }
        return true;
      },
    });

  const closeWebSocket = () => {
    const webSocket = getWebSocket();
    if (webSocket) {
      console.log('Closing WebSocket programmatically');
      webSocket.close();
    }
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return {
    sendJsonMessage,
    lastMessage,
    readyState,
    connectionStatus,
    closeWebSocket,
  };
};

const useInactivity = (onInactive: () => void, timeout: number = 30000) => {
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      onInactive();
    }, timeout);
  }, [onInactive, timeout]);

  useEffect(() => {
    const handleUserActivity = () => {
      resetTimer();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    // Start the timer on mount
    resetTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [timeout, onInactive, resetTimer]);

  return { resetTimer };
};
