import { PlayerInfo } from "@/types/lobby";
import { useReadLocalStorage } from "usehooks-ts";

export const usePlayer = () => {
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
};
