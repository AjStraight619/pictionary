import React, { createContext, ReactNode, useContext } from "react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket"; // Adjust path

type WebSocketContextValue = ReturnType<typeof useCustomWebsocket> | null;

const WebSocketContext = createContext<WebSocketContextValue>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const ws = useCustomWebsocket({
    messageTypes: ["game-state", "player-update"],
    queryParams: {},
  });

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
};

export const useWS = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider",
    );
  }
  return context;
};
