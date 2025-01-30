//import { useEffect, useState } from "react";
//import { useParams } from "react-router";
//import useWebSocket, { ReadyState } from "react-use-websocket";
//import { WebSocketLike } from "react-use-websocket/dist/lib/types";
//import { useReadLocalStorage } from "usehooks-ts";
//
//type QueryParams = {
//  [key: string]: string | number; // Allows any string key with values of type string or number
//};
//
//type UseCustomWebsocketArgs = {
//  messageTypes: string[];
//  url?: string;
//  gameId?: string;
//  queryParams?: QueryParams;
//};
//
//const heartbeatState = {
//  isHeartbeatActive: false,
//  missedPongCount: 0,
//  intervalId: null as NodeJS.Timeout | null,
//};
//
//// TODO: Extend player info and sync with server state
//
//export const useCustomWebsocket = ({
//  messageTypes,
//  queryParams,
//}: UseCustomWebsocketArgs) => {
//  const playerInfo = useReadLocalStorage<{
//    playerId: string;
//    name: string;
//  } | null>("playerInfo");
//
//  const [shouldReconnect] = useState(true);
//
//  const userId = playerInfo?.playerId as string;
//  const username = playerInfo?.name as string;
//
//  const { id } = useParams();
//
//  const augmentedQueryParams = { ...queryParams, userId, username };
//
//  const {
//    sendJsonMessage,
//    sendMessage,
//    lastMessage,
//    readyState,
//    getWebSocket,
//  } = useWebSocket(`ws://localhost:8000/game/${id}`, {
//    queryParams: augmentedQueryParams,
//    share: true,
//    shouldReconnect: () => {
//      return shouldReconnect;
//    },
//    reconnectAttempts: 3,
//    // Exponential backoff reconnect strategy
//    reconnectInterval: (attemptNumber) => {
//      console.log("Attempting to reconnect for the ", attemptNumber, " time");
//      return Math.min(Math.pow(2, attemptNumber) * 1000, 10000);
//    },
//    onOpen: () => console.log("opened: ", new Date().toLocaleTimeString()),
//
//    onClose: (event) => {
//      console.log(
//        `WebSocket closed with code: ${event.code}, reason: ${event.reason}`,
//      );
//    },
//    onError: (error) => console.log("error: ", error),
//    onReconnectStop: () =>
//      console.log("reconnect stopped", new Date().toLocaleTimeString()),
//
//    filter: (message) => {
//      if (message.data === "pong") {
//        console.log("Received pong");
//        return true;
//      }
//
//
//      try {
//
//      }
//
//      const newMessage = JSON.parse(message.data);
//
//      // If message type is included in types passed to hook return true otherwise return false
//      if (!messageTypes.includes(newMessage.type)) {
//        return false;
//      }
//      return true;
//    },
//  });
//
//  // TODO: Test this function to remove someone from WS if away time is too long
//  //
//  //
//
//  useEffect(() => {
//    const webSocket = getWebSocket();
//    if (readyState === ReadyState.OPEN && !heartbeatState.isHeartbeatActive) {
//      startHeartbeat(webSocket);
//    }
//
//    return () => {
//      if (heartbeatState.isHeartbeatActive) {
//        stopHeartbeat();
//      }
//    };
//  }, [readyState, getWebSocket]);
//
//  // Handle incoming pong messages
//  useEffect(() => {
//    if (lastMessage?.data === "pong") {
//      console.log("Received pong");
//      heartbeatState.missedPongCount = 0;
//    }
//  }, [lastMessage]);
//
//  // Singleton: Start the heartbeat
//  const startHeartbeat = (webSocket: WebSocketLike | null) => {
//    if (heartbeatState.isHeartbeatActive || !webSocket) return;
//
//    console.log("Starting heartbeat");
//    heartbeatState.isHeartbeatActive = true;
//
//    heartbeatState.intervalId = setInterval(() => {
//      if (readyState === ReadyState.OPEN) {
//        console.log("Sending ping");
//        sendMessage("ping");
//        heartbeatState.missedPongCount++;
//
//        if (heartbeatState.missedPongCount > 3) {
//          console.warn("Missed pong response. Closing WebSocket.");
//          closeWebSocket();
//        }
//      }
//    }, 10000); // Send ping every 10 seconds
//  };
//
//  // Singleton: Stop the heartbeat
//  const stopHeartbeat = () => {
//    if (!heartbeatState.isHeartbeatActive) return;
//
//    console.log("Stopping heartbeat");
//    heartbeatState.isHeartbeatActive = false;
//
//    if (heartbeatState.intervalId) {
//      clearInterval(heartbeatState.intervalId);
//      heartbeatState.intervalId = null;
//    }
//  };
//
//  const closeWebSocket = () => {
//    const webSocket = getWebSocket();
//    if (webSocket) {
//      console.log("Closing WebSocket programmatically");
//      webSocket.close();
//    }
//  };
//
//  // Connection status of client
//
//  const connectionStatus = {
//    [ReadyState.CONNECTING]: "Connecting",
//    [ReadyState.OPEN]: "Open",
//    [ReadyState.CLOSING]: "Closing",
//    [ReadyState.CLOSED]: "Closed",
//    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
//  }[readyState];
//
//  return {
//    sendJsonMessage,
//    lastMessage,
//    readyState,
//    connectionStatus,
//    closeWebSocket,
//  };
//};

import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WebSocketLike } from "react-use-websocket/dist/lib/types";
import { useReadLocalStorage } from "usehooks-ts";

type QueryParams = {
  [key: string]: string | number;
};

type UseCustomWebsocketArgs = {
  messageTypes: string[];
  url?: string;
  gameId?: string;
  queryParams?: QueryParams;
};

//const heartbeatState = {
//  isHeartbeatActive: false,
//  missedPongCount: 0,
//  intervalId: null as NodeJS.Timeout | null,
//};

export const useCustomWebsocket = ({
  messageTypes,
  queryParams,
}: UseCustomWebsocketArgs) => {
  const playerInfo = useReadLocalStorage<{
    playerId: string;
    name: string;
  } | null>("playerInfo");

  const userId = playerInfo?.playerId as string;
  const username = playerInfo?.name as string;

  const { id } = useParams();

  const augmentedQueryParams = { ...queryParams, userId, username };

  const { sendJsonMessage, lastMessage, readyState, getWebSocket } =
    useWebSocket(`ws://localhost:8000/game/${id}`, {
      queryParams: augmentedQueryParams,
      share: true,
      shouldReconnect: () => true,
      reconnectAttempts: 3,
      reconnectInterval: (attemptNumber) =>
        Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
      onOpen: () =>
        console.log("WebSocket opened at", new Date().toLocaleTimeString()),
      onClose: (event) =>
        console.log(
          `WebSocket closed: code ${event.code}, reason: ${event.reason}`,
        ),
      onError: (error) => console.log("WebSocket error:", error),
      onReconnectStop: () =>
        console.log("Reconnect stopped at", new Date().toLocaleTimeString()),
      filter: (message) => {
        try {
          const newMessage = JSON.parse(message.data);

          // Propagate only valid message types
          return messageTypes.includes(newMessage.type);
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

  //useEffect(() => {
  //  const webSocket = getWebSocket();
  //  if (readyState === ReadyState.OPEN && !heartbeatState.isHeartbeatActive) {
  //    startHeartbeat(webSocket);
  //  }
  //
  //  return () => {
  //    stopHeartbeat();
  //  };
  //}, [readyState, getWebSocket]);

  //const startHeartbeat = (webSocket: WebSocketLike | null) => {
  //  if (heartbeatState.isHeartbeatActive || !webSocket) return;
  //
  //  console.log("Starting heartbeat");
  //  heartbeatState.isHeartbeatActive = true;
  //
  //  heartbeatState.intervalId = setInterval(() => {
  //    if (readyState === ReadyState.OPEN) {
  //      console.log("Sending ping");
  //      sendMessage("ping");
  //      heartbeatState.missedPongCount++;
  //
  //      if (heartbeatState.missedPongCount > 3) {
  //        console.warn("Missed pong responses. Closing WebSocket.");
  //        closeWebSocket();
  //      }
  //    }
  //  }, 10000); // 10-second interval
  //};
  //
  //const stopHeartbeat = () => {
  //  if (!heartbeatState.isHeartbeatActive) return;
  //
  //  console.log("Stopping heartbeat");
  //  heartbeatState.isHeartbeatActive = false;
  //
  //  if (heartbeatState.intervalId) {
  //    clearInterval(heartbeatState.intervalId);
  //    heartbeatState.intervalId = null;
  //  }
  //};

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
