import { PlayerInfo } from "@/types/lobby";
import { MessageHandlers, MessagePayloadMap } from "@/types/messages";
import { useNavigate, useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useReadLocalStorage } from "usehooks-ts";
import { useEffect } from "react";
import { WS_URL } from "@/utils/config";

type QueryParams = {
  [key: string]: string | number;
};

type UseCustomWebsocketArgs = {
  messageTypes?: string[];
  messageHandlers?: MessageHandlers;
  queryParams?: QueryParams;
};

// Create a static option object to be reused across all instances
// This prevents each hook instance from creating its own heartbeat
const sharedWebsocketOptions = {
  shouldReconnect: () => true,
  reconnectAttempts: 5,
  reconnectInterval: (attemptNumber: number) =>
    Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
  heartbeat: {
    message: () => "ping",
    returnMessage: "pong",
    interval: 54000,
    timeout: 59000,
  },
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
    useWebSocket(`${WS_URL}/${id}`, {
      queryParams: augmentedQueryParams,
      share: true,
      filter: (message) => {
        try {
          const newMessage = JSON.parse(message.data);
          // Propagate only valid message types
          return messageTypes?.includes(newMessage.type) ?? false;
        } catch {
          return false; // Ignore invalid JSON
        }
      },
      // We're using the shared options object for heartbeat and reconnection settings
      ...sharedWebsocketOptions,
      onOpen: () => {
        console.log("WebSocket opened at", new Date().toLocaleTimeString());
        console.log(`Connected to WebSocket at ${WS_URL}/${id}`);
        console.log("Player info used for connection:", { playerID, username });
      },
      onClose: (event) => {
        console.log(
          `WebSocket closed: code ${event.code}, reason: ${
            event.reason || "none provided"
          }`
        );
        console.log(`Connection was to: ${WS_URL}/${id}`);
      },
      onError: (error) => {
        console.log("WebSocket error:", error);
        console.log(`Failed connection to: ${WS_URL}/${id}`);
        console.log("Player info used:", { playerID, username });
      },
      onReconnectStop: () => {
        console.log("Reconnect stopped at", new Date().toLocaleTimeString());
        //TODO: Trigger a modal here to inform the user that the connection has been lost
        navigate("/");
      },
    });

  // Process messages and call appropriate handlers
  useEffect(() => {
    if (lastMessage && Object.keys(messageHandlers).length > 0) {
      try {
        const parsedMessage = JSON.parse(lastMessage.data);
        const messageType = parsedMessage.type as keyof MessagePayloadMap;

        // If we have a handler for this message type, call it with properly typed payload
        const handler = messageHandlers[messageType];
        if (handler) {
          // @ts-expect-error: We know the payload is correct for this message type
          handler(parsedMessage.payload);
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

  // Type-safe function to send messages
  const sendWSMessage = <K extends keyof MessagePayloadMap>(
    type: K,
    payload: MessagePayloadMap[K]
  ) => {
    sendJsonMessage({ type, payload });
  };

  return {
    sendJsonMessage,
    sendWSMessage,
    lastMessage,
    readyState,
    connectionStatus,
    closeWebSocket,
  };
};
