import DrawerCanvas from "./drawer-canvas";
import ViewerCanvas from "./viewer-canvas";
import { useGame } from "@/providers/game-provider";

const Canvas = () => {
  const { isDrawingPlayer } = useGame();

  return <>{isDrawingPlayer ? <DrawerCanvas /> : <ViewerCanvas />}</>;
};

export default Canvas;
