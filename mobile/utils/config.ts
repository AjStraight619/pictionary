import { Platform } from "react-native";
import Constants from "expo-constants";

// This determines if we're running in a production build
const isProduction = !__DEV__;

// Get the local machine's IP address for development
// When developing with Expo, we need to use the development machine's actual IP address
// instead of localhost because the app runs on a real device or emulator
const getLocalIp = () => {
  // Your actual IP address from ifconfig output (en0 interface)
  return "192.168.1.27";
};

const config = {
  // API config
  api: {
    // In production, point to your deployed backend
    // In development, point to your local backend
    baseUrl: isProduction
      ? "https://your-production-backend-url.com" // Replace with your production URL
      : `http://${getLocalIp()}:8080`,
  },

  // WebSocket config
  ws: {
    // WebSocket URLs typically use ws:// or wss:// protocol
    // The path is /game/:id (not /ws) based on the backend routes
    url: isProduction
      ? "wss://your-production-backend-url.com/game" // Replace with your production WebSocket URL
      : `ws://${getLocalIp()}:8080/game`,
  },
};

export default config;
