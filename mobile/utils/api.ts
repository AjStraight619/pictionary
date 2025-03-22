import { GameOptions } from "../types/game";
import { PlayerInfo } from "../types/lobby";
import config from "./config";

// Use the API base URL from config
const API_BASE_URL = config.api.baseUrl;

// Create a game
export async function createGame(
  username: string,
  options: GameOptions
): Promise<{ gameID: string; playerID: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/game/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, options }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create the game");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
}

// Join a game
export async function joinGame(
  username: string,
  gameCode: string
): Promise<{ gameID: string; playerID: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/game/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, gameID: gameCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to join the game");
    }

    return await response.json();
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
}
