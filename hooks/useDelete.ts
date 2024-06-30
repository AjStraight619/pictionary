import { fabric } from "fabric";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

export type UseDeleteType = {
  sendJsonMessage: SendJsonMessage;
  clearCanvas: () => fabric.Canvas;
};

export const useDelete = ({ sendJsonMessage, clearCanvas }: UseDeleteType) => {
  sendJsonMessage({ type: "drawing", data: "delete-all" });
  clearCanvas();
};
