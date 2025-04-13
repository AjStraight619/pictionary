export type PlayerInfo = {
  playerID: string;
  username: string;
};

export type Player = {
  ID: string;
  username: string;
  isDrawing: boolean;
  isGuessCorrect: boolean;
  isHost: boolean;
  score: number;
  color: string;
  ready: boolean;
};
