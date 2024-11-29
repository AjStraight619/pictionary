import React from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';

type WebSocketContextType = {
  sendJsonMessage: (message: SendJsonMessage) => void;
  lastMessage: WebSocketEventMap['message'] | null;
  connectionStatus: string;
};

const WebSocketContext = React.createContext<WebSocketContextType | null>(null);

const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    'ws://localhost:8000/game/123',
    {
      onOpen: () => console.log('opened'),
      onClose: () => console.log('closed'),
      onError: () => console.log('error'),
      heartbeat: {
        interval: 5000,
        message: 'ping',
        returnMessage: 'pong',
      },
      filter: message => {
        console.log('message:', message.data);
        return true;
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
