import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlayerInfo } from "../types/lobby";

export const STORAGE_KEYS = {
  PLAYER_INFO: "playerInfo",
};

export async function getPlayerInfo(): Promise<PlayerInfo | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_INFO);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error getting player info from storage:", error);
    return null;
  }
}

export async function setPlayerInfo(playerInfo: PlayerInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PLAYER_INFO,
      JSON.stringify(playerInfo)
    );
  } catch (error) {
    console.error("Error saving player info to storage:", error);
  }
}

export async function clearPlayerInfo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PLAYER_INFO);
  } catch (error) {
    console.error("Error clearing player info from storage:", error);
  }
}
