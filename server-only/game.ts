import 'server-only';
import { db } from '@/lib/db';

export const getOpenGames = async (roomId: string) => {
  const game = await db.game.findMany({
    where: {
      isOpen: true,
    },
    include: {
      players: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      rounds: true,
    },
  });
  return game;
};

export const getMyGames = async (userId: string) => {
  const myGames = await db.game.findMany({
    where: {
      players: {
        some: {
          playerId: userId,
          isLeader: true,
        },
      },
    },
    include: {
      players: true,
      rounds: true,
    },
  });
  return myGames;
};
