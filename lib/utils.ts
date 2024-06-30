import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import pako from "pako";
import { DrawingData, WSMessage } from "@/types/ws";
import { PLAYER_COLORS } from "./constants";
import { ReadyState } from "react-use-websocket";
import { CustomFabricObjectShape } from "./customFabricObjects";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function compressMessage(message: WSMessage): Uint8Array {
  const jsonString = JSON.stringify(message);
  return pako.deflate(jsonString);
}

export function decompressMessage(data: ArrayBuffer): WSMessage {
  const compressedData = new Uint8Array(data);
  const decompressedData = pako.inflate(compressedData, { to: "string" });
  return JSON.parse(decompressedData);
}

export function generatePathData(points: DrawingData[]): string {
  if (points.length === 0) {
    return "";
  }

  let pathData = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    pathData += ` L ${points[i].x} ${points[i].y}`;
  }

  return pathData;
}

export function convertPathDataToSvgPathString(
  pathData: (string | number)[][]
): string {
  return pathData.map((segment) => segment.join(" ")).join(" ");
}

export const getPlayerColor = (playerCount: number): string => {
  return PLAYER_COLORS[playerCount % PLAYER_COLORS.length];
};

export const addAlphaToHex = (hex: string, alpha: number): string => {
  const alphaHex = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return hex + alphaHex;
};

export const getConnectionStatus = (readyState: ReadyState) => {
  const status = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  };

  return status[readyState];
};

export const storeInitialPositions = (objects: CustomFabricObjectShape[]) => {
  objects.forEach((obj) => {
    if (obj.setInitialPosition) {
      obj.setInitialPosition();
    }
  });
};

export const calculateNewPosition = (
  obj: CustomFabricObjectShape,
  activeSelection: CustomFabricObjectShape
) => {
  if (
    typeof obj.left !== "number" ||
    typeof obj.top !== "number" ||
    typeof obj.width !== "number" ||
    typeof obj.height !== "number" ||
    typeof activeSelection.height !== "number" ||
    typeof activeSelection.width !== "number" ||
    typeof activeSelection.left !== "number" ||
    typeof activeSelection.top !== "number"
  ) {
    return null;
  }

  const objCenterX = obj.left + obj.width / 2;
  const objCenterY = obj.top + obj.height / 2;

  const activeSelectionCenterX =
    activeSelection.left + activeSelection.width / 2;
  const activeSelectionCenterY =
    activeSelection.top + activeSelection.height / 2;

  const newLeft = activeSelectionCenterX + (obj.left - objCenterX);
  const newTop = activeSelectionCenterY + (obj.top - objCenterY);

  return { newLeft, newTop };
};

export const updateObjectSVG = (obj: CustomFabricObjectShape) => {
  return obj.toSVG();
};
