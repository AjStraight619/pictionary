export type Player = {
  id: string;
  name: string;
  score: number;
  socket: WebSocket;
  color: string;
};

export type PlayerInfo = {
  playerId: string;
  name: string;
};
