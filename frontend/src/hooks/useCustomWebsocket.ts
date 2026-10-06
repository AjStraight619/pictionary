import { PlayerInfo } from "@/types/lobby";
import { MessageHandlers, MessagePayloadMap } from "@/types/messages";
import { useNavigate, useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useReadLocalStorage } from "usehooks-ts";
import { useCallback, useRef } from "react";
import { WS_URL } from "@/utils/config";

type QueryParams = {
  [key: string]: string | number;
};

type UseCustomWebsocketArgs = {
  messageTypes?: (keyof MessagePayloadMap)[];
  messageHandlers?: MessageHandlers;
  queryParams?: QueryParams;
};

// The server sends protocol ping frames; the browser automatically replies.
const sharedWebsocketOptions = {
  shouldReconnect: () => true,
  reconnectAttempts: 5,
  reconnectInterval: (attemptNumber: number) =>
    Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
};

export const useCustomWebsocket = ({
  messageTypes,
  messageHandlers = {},
  queryParams,
}: UseCustomWebsocketArgs = {}) => {
  const handlersRef = useRef(messageHandlers);
  handlersRef.current = messageHandlers;
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  const playerID = playerInfo?.playerID as string;
  const username = playerInfo?.username as string;
  const navigate = useNavigate();
  const { id } = useParams();
  const augmentedQueryParams = { ...queryParams, playerID, username };

  const fullWsUrl = `${WS_URL}/${id}`;

  // Compute message types from handlers and/or explicit messageTypes
  const handlerTypes = messageHandlers ? Object.keys(messageHandlers) : [];
  const filterTypes = messageTypes ? messageTypes : [];
  const allTypes = Array.from(new Set([...handlerTypes, ...filterTypes]));

  const {
    sendJsonMessage,
    lastMessage,
    readyState,
    getWebSocket,
  } = useWebSocket(fullWsUrl, {
    queryParams: augmentedQueryParams,
    share: true,
    filter: (message) => {
      try {
        const newMessage = JSON.parse(message.data);
        // If no types specified, allow all. Otherwise, filter.
        return allTypes.length === 0
          ? true
          : allTypes.includes(newMessage.type);
      } catch {
        console.warn("🔷 Invalid JSON:", message.data);
        return false; // Ignore invalid JSON
      }
    },
    // Using shared options without heartbeat
    ...sharedWebsocketOptions,
    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data);
        const handler = handlersRef.current[message.type as keyof MessagePayloadMap];
        // The runtime message type selects its matching payload handler.
        if (handler) (handler as (payload: unknown) => void)(message.payload);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    },
    onOpen: () => {
      console.log("WebSocket opened at", new Date().toLocaleTimeString());
      console.log(`Connected to WebSocket at ${fullWsUrl}`);
      console.log("Player info used for connection:", { playerID, username });
    },
    onClose: (event) => {
      console.log(
        `WebSocket closed: code ${event.code}, reason: ${
          event.reason || "none provided"
        }`
      );
      console.log(`Connection was to: ${fullWsUrl}`);
    },
    onError: (error) => {
      console.log("WebSocket error:", error);
      console.log(`Failed connection to: ${fullWsUrl}`);
      console.log("Player info used:", { playerID, username });
    },
    onReconnectStop: () => {
      console.log("Reconnect stopped at", new Date().toLocaleTimeString());
      //TODO: Trigger a modal here to inform the user that the connection has been lost
      navigate("/");
    },
  });

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

  // Type-safe function to send messages
  const sendWSMessage = useCallback(<K extends keyof MessagePayloadMap>(
    type: K,
    payload?: MessagePayloadMap[K]
  ) => {
    sendJsonMessage({ type, payload });
  }, [sendJsonMessage]);

  return {
    sendJsonMessage,
    sendWSMessage,
    lastMessage,
    readyState,
    connectionStatus,
    closeWebSocket,
  };
};
