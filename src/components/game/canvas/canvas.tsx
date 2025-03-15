import DrawerCanvas from "./drawer-canvas";
import ViewerCanvas from "./viewer-canvas";
import { useCurrentDrawerFromPlayers } from "@/hooks/useGameSelector";
import { useReadLocalStorage } from "usehooks-ts";
import { PlayerInfo } from "@/types/lobby";

const Canvas = () => {
  const currentDrawerId = useCurrentDrawerFromPlayers();
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  const isCurrentDrawer = playerInfo?.playerID === currentDrawerId;

  return <>{isCurrentDrawer ? <DrawerCanvas /> : <ViewerCanvas />}</>;
};

export default Canvas;
