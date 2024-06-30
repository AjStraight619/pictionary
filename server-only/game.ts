import "server-only";
import { db } from "@/lib/db";

export const getOpenGames = async (roomId: string) => {
  const game = await db.game.findMany({
    where: {
      isOpen: true,
    },
    include: {
      players: {
        orderBy: {
          createdAt: "asc",
        },
      },
      rounds: true,
    },
  });
  return game;
};
