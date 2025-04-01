export type PlayerInfo = {
  playerID: string;
  username: string;
};

export type GameOptions = {
  roundLimit: number;
  turnTimeLimit: number;
  selectWordTimeLimit: number;
  maxPlayers?: number;
};
