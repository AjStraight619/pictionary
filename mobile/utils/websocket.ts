import { MessageHandlers, MessagePayloadMap } from "../types/messages";
import config from "./config";
import { getPlayerInfo } from "./storage";

// Use the WebSocket URL from config
const WS_URL = config.ws.url;

interface WebSocketMessage {
  type: string;
  payload: any;
}

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private gameID: string;
  private playerID: string;
  private username: string = "";
  private handlers: Record<string, (payload: any) => void> = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(gameID: string, playerID: string) {
    this.gameID = gameID;
    this.playerID = playerID;
  }

  public async connect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
    }

    // Get the player info from storage to retrieve the username
    try {
      const playerInfo = await getPlayerInfo();
      if (playerInfo && playerInfo.username) {
        this.username = playerInfo.username;
      } else {
        console.error("Could not retrieve username from storage");
        return;
      }
    } catch (error) {
      console.error("Error getting player info:", error);
      return;
    }

    // Update URL format to match backend's path structure and include username parameter
    const url = `${WS_URL}/${this.gameID}?playerID=${
      this.playerID
    }&username=${encodeURIComponent(this.username)}`;
    console.log("Connecting to WebSocket:", url);

    this.ws = new WebSocket(url);

    this.ws.onopen = this.handleOpen;
    this.ws.onmessage = this.handleMessage;
    this.ws.onclose = this.handleClose;
    this.ws.onerror = this.handleError;
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  public send<T extends keyof MessagePayloadMap>(
    type: T,
    payload: MessagePayloadMap[T]
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return;
    }

    const message = JSON.stringify({ type, payload });
    this.ws.send(message);
  }

  public on<T extends keyof MessagePayloadMap>(
    type: T,
    handler: (payload: MessagePayloadMap[T]) => void
  ): void {
    this.handlers[type as string] = handler as (payload: any) => void;
  }

  private handleOpen = (): void => {
    console.log("WebSocket connected");
    this.isConnected = true;
    this.reconnectAttempts = 0;
  };

  private handleMessage = (event: { data: string }): void => {
    try {
      const { type, payload } = JSON.parse(event.data) as WebSocketMessage;

      if (type && this.handlers[type]) {
        this.handlers[type](payload);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  private handleClose = (event: { code: number; reason: string }): void => {
    console.log("WebSocket closed", event.code, event.reason);
    this.isConnected = false;

    // Try to reconnect if not deliberately closed
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

      this.reconnectTimeout = setTimeout(() => {
        console.log(
          `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
        );
        this.connect();
      }, delay);
    }
  };

  private handleError = (event: Event): void => {
    console.error("WebSocket error:", event);
  };
}
