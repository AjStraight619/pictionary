import { GamePlayer } from '@prisma/client';

type UsePlayers = {
  players: GamePlayer[];
};

export const usePlayers = ({ players }: UsePlayers) => {};
