export type GameState = {
  id: string;
  players: Player[];
  rounds: Round[];
};

export type Player = {
  id: string;
  name: string;
  score: number;
  socket: WebSocket;
};

export type Round = {
  number: number;
  currentDrawer: Player;
};
