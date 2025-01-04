import { useState } from "react";
import { useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useReadLocalStorage } from "usehooks-ts";

type QueryParams = {
  [key: string]: string | number; // Allows any string key with values of type string or number
};

type UseCustomWebsocketArgs = {
  messageTypes: string[];
  url?: string;
  gameId?: string;
  queryParams?: QueryParams;
};

// TODO: Extend player info and sync with server state

type PlayerInfo = {
  playerId: string;
  name: string;
};

export const useCustomWebsocket = ({
  messageTypes,
  queryParams,
}: UseCustomWebsocketArgs) => {
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  // TODO: Implement reconnect logic (using this for automatic reconnects on mouse, key, movements)

  // TODO: Implement setShouldReconnect state updater with reconnect logic

  const [shouldReconnect] = useState(true);

  const userId = playerInfo?.playerId as string;
  const username = playerInfo?.name as string;

  const { id } = useParams();

  const augmentedQueryParams = { ...queryParams, userId, username };

  const { sendJsonMessage, lastMessage, readyState, getWebSocket } =
    useWebSocket(`ws://localhost:8000/game/${id}`, {
      queryParams: augmentedQueryParams,
      share: true,
      shouldReconnect: () => {
        return shouldReconnect;
      },
      reconnectAttempts: 3,
      // Exponential backoff reconnect strategy
      reconnectInterval: (attemptNumber) => {
        console.log("Attempting to reconnect for the ", attemptNumber, " time");
        return Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
      },
      onOpen: () => console.log("opened: ", new Date().toLocaleTimeString()),
      onClose: () => console.log("closed: ", new Date().toLocaleTimeString()),
      onError: (error) => console.log("error: ", error),
      onReconnectStop: () =>
        console.log("reconnect stopped", new Date().toLocaleTimeString()),
      heartbeat: {
        timeout: 60000,
        interval: 10000,
        message: "ping",
        returnMessage: "pong",
      },
      filter: (message) => {
        if (message.data === "pong") {
          console.log(
            "Recieved pong message from client, filtering out message",
          );
          return false;
        }

        const newMessage = JSON.parse(message.data);

        // Allow messages of any type in `messageTypes`
        // If message type is included in types passed to hook return true otherwise return false
        if (!messageTypes.includes(newMessage.type)) {
          return false;
        }
        return true;
      },
    });

  // TODO: Test this function to remove someone from WS if away time is too long

  const closeWebSocket = () => {
    const webSocket = getWebSocket();
    if (webSocket) {
      console.log("Closing WebSocket programmatically");
      webSocket.close();
    }
  };

  // Connection status of client

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return {
    sendJsonMessage,
    lastMessage,
    readyState,
    connectionStatus,
    closeWebSocket,
  };
};
