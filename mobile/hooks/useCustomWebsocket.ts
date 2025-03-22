import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketMessage {
  data: string;
  type: string;
}

interface UseCustomWebsocketOptions {
  messageTypes?: string[];
  url?: string;
}

const useCustomWebsocket = ({
  messageTypes = [],
  url = "ws://localhost:8080/ws", // Default WebSocket server URL
}: UseCustomWebsocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(url);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);

            // Filter messages by type if messageTypes array is provided
            if (
              messageTypes.length === 0 ||
              messageTypes.includes(parsedData.type)
            ) {
              setLastMessage({
                data: event.data,
                type: parsedData.type,
              });
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);

          // Try to reconnect after a delay
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          ws.close();
        };

        wsRef.current = ws;
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, messageTypes]);

  // Send message function
  const sendMessage = useCallback(
    (message: string) => {
      if (wsRef.current && isConnected) {
        wsRef.current.send(message);
        return true;
      }
      return false;
    },
    [isConnected]
  );

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
};

export default useCustomWebsocket;
