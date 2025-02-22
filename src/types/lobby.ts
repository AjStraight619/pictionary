export type Player = {
  playerId: string;
  username: string;
  isDrawing: boolean;
  isGuessCorrect: boolean;
  isLeader: boolean;
  score: number;
  color: string;
};

export type PlayerInfo = {
  playerID: string;
  username: string;
};
