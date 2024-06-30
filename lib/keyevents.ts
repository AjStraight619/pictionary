import { fabric } from "fabric";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { CustomFabricObjectShape } from "./customFabricObjects";
type KeyDown = {
  e: KeyboardEvent;
  canvas: fabric.Canvas;
  sendJsonMessage: SendJsonMessage;
};

export const handleKeyDown = ({ e, canvas, sendJsonMessage }: KeyDown) => {
  const activeObjects = canvas.getActiveObjects() as CustomFabricObjectShape[];
  if (e.key === "Backspace") {
    activeObjects.forEach((obj) => {
      const objId = obj.id;
      canvas.remove(obj);
      sendJsonMessage({
        type: "drawing",
        data: {
          svg: {
            action: "deleteById",
            id: objId,
          },
        },
      });
    });
  }
};
