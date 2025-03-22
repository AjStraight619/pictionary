import { useReadLocalStorage } from "usehooks-ts";
import { useCurrentDrawerFromPlayers } from "./useGameSelector";
import { PlayerInfo } from "@/types/lobby";

export const useIsCurrentDrawer = (): boolean => {
  const currentDrawerId = useCurrentDrawerFromPlayers();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  return currentDrawerId === playerInfo?.playerID;
};
