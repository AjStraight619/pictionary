export type Player = {
  id: string;
  name: string;
  score: number;
  socket: WebSocket;
};

export type PlayerInfo = {
  playerId: string;
  name: string;
};
