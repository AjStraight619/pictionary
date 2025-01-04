import { PlayerInfo } from '@/types/lobby';
import React from 'react';
import { useParams } from 'react-router';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { useLocalStorage, useReadLocalStorage } from 'usehooks-ts';

type WebSocketContextType = {
  sendJsonMessage: (message: SendJsonMessage) => void;
  lastMessage: WebSocketEventMap['message'] | null;
  connectionStatus: string;
};

const WebSocketContext = React.createContext<WebSocketContextType | null>(null);

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const playerInfo = useReadLocalStorage<PlayerInfo | null>('playerInfo');

  const { id } = useParams();

  const userId = playerInfo?.playerId as string;
  const username = playerInfo?.name as string;

  const queryParams = { userId, username };

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    `ws://localhost:8000/game/${id}`,
    {
      queryParams,
      share: true,
      shouldReconnect: () => true,
      reconnectAttempts: 3,
      reconnectInterval: attemptNumber =>
        Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
      filter: message => {
        if (message.data === 'pong') {
          return false;
        }
        const newMessage = JSON.parse(message.data);
        return messageTypes.includes(newMessage.type);
      },
    },
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return (
    <WebSocketContext.Provider
      value={{ sendJsonMessage, lastMessage, connectionStatus }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
