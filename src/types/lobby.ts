export type Player = {
  playerID: string;
  username: string;
  isDrawing: boolean;
  isGuessCorrect: boolean;
  isHost: boolean;
  score: number;
  color: string;
};

export type PlayerInfo = {
  playerID: string;
  username: string;
};
