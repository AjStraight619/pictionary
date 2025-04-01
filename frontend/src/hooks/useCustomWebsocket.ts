import { PlayerInfo } from "@/types/lobby";
import { useNavigate, useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useReadLocalStorage } from "usehooks-ts";
import { useEffect } from "react";

type QueryParams = {
  [key: string]: string | number;
};

type MessageHandler = (payload: any) => void;

type MessageHandlers = {
  [messageType: string]: MessageHandler;
};

type UseCustomWebsocketArgs = {
  messageTypes?: string[];
  messageHandlers?: MessageHandlers;
  url?: string;
  gameId?: string;
  queryParams?: QueryParams;
};

export const useCustomWebsocket = ({
  messageTypes,
  messageHandlers = {},
  queryParams,
}: UseCustomWebsocketArgs) => {
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  const playerID = playerInfo?.playerID as string;
  const username = playerInfo?.username as string;
  const navigate = useNavigate();
  const { id } = useParams();
  const augmentedQueryParams = { ...queryParams, playerID, username };

  const { sendJsonMessage, lastMessage, readyState, getWebSocket } =
    useWebSocket(`ws://localhost:8080/game/${id}`, {
      queryParams: augmentedQueryParams,
      share: true,
      shouldReconnect: () => true,
      reconnectAttempts: 5,
      reconnectInterval: (attemptNumber) =>
        Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
      onOpen: () =>
        console.log("WebSocket opened at", new Date().toLocaleTimeString()),
      onClose: (event) =>
        console.log(
          `WebSocket closed: code ${event.code}, reason: ${event.reason}`
        ),
      onError: (error) => console.log("WebSocket error:", error),
      onReconnectStop: () => {
        console.log("Reconnect stopped at", new Date().toLocaleTimeString());
        //TODO: Trigger a modal here to inform the user that the connection has been lost
        navigate("/");
      },
      filter: (message) => {
        try {
          const newMessage = JSON.parse(message.data);
          // Propagate only valid message types
          return messageTypes?.includes(newMessage.type) ?? false;
        } catch {
          return false; // Ignore invalid JSON
        }
      },
      heartbeat: {
        message: () => {
          return "ping";
        },
        returnMessage: "pong",
        interval: 54000,
        timeout: 59000,
      },
    });

  // Process messages and call appropriate handlers
  useEffect(() => {
    if (lastMessage && Object.keys(messageHandlers).length > 0) {
      try {
        const parsedMessage = JSON.parse(lastMessage.data);
        const messageType = parsedMessage.type;

        // If we have a handler for this message type, call it
        if (messageHandlers[messageType]) {
          messageHandlers[messageType](parsedMessage.payload);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    }
  }, [lastMessage, messageHandlers]);

  const closeWebSocket = () => {
    const webSocket = getWebSocket();
    if (webSocket) {
      console.log("Programmatically closing WebSocket");
      webSocket.close();
    }
  };

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
