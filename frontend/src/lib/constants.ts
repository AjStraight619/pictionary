// Set base API URL from environment variable or fallback to localhost
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// WebSocket URL from environment variable or fallback
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080/game";
