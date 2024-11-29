export type GameState = {
  id: string;
  players: Player[];
  rounds: Round[];
  currentWord: string | null;
  timers: GameTimers | null;
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

export type TimerType = 'game' | 'round' | 'idle';

export type GameTimers = {
  [key in TimerType]?: number;
};
