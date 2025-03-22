import { PlayerInfo } from "@/types/lobby";
import { useReadLocalStorage } from "usehooks-ts";
import { usePlayers } from "./useGameSelector";

export const usePlayer = () => {
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  const players = usePlayers();
  return players.find((p) => p.ID === playerInfo?.playerID);
};
