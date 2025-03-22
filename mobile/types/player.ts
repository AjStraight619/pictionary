export interface PlayerInfo {
  playerID: string;
  username: string;
}

export interface GameOptions {
  roundLimit: number;
  turnTimeLimit: number;
  selectWordTimeLimit: number;
  maxPlayers: number;
}
