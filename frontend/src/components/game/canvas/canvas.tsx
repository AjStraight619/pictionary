import DrawerCanvas from "./drawer-canvas";
import ViewerCanvas from "./viewer-canvas";
import { useGame } from "@/providers/game-provider";

const Canvas = () => {
  const { players } = useGame();

  const isDrawingPlayer = players.find((p) => p.isDrawing);

  console.log("Is drawing player: ", isDrawingPlayer);

  return <>{isDrawingPlayer ? <DrawerCanvas /> : <ViewerCanvas />}</>;
};

export default Canvas;
