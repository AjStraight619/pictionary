export type ChatMessage = {
  id: string;
  username: string;
  message: string;
  isCorrect: boolean;
  isClose: boolean;
};

export type DrawingData = {
  id: string;
  type: Figure;
  x: number;
  y: number;
  color: string;
  width?: number;
  height?: number;
  radius?: number;
};

type Figure = "pencil" | "rectangle" | "circle" | "triangle";
type Point = {
  x: number;
  y: number;
};
export type CountdownData = {
  time: number;
};

export type WSMessage = {
  type: "chat" | "drawing" | "countdown";
  data: ChatMessage | DrawingData[] | CountdownData;
};

export type MainComponentsWSInfo = {
  userId: string;
  roomId: string;
};
