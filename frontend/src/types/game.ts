import { Player } from './lobby';

export type GameState = {
  id: string;
  players: Player[];
  rounds: Round[];
  currentWord: string | null;
};

export type Round = {
  number: number;
  currentDrawer: Player;
};
