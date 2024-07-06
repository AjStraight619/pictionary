"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function startNewRound(gameId: string) {
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
      },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.players.length === 0) {
      throw new Error("No players found in the game");
    }

    const firstDrawer = game.players[0];

    console.log("First drawer: ", firstDrawer);

    const drawerExists = await db.player.findUnique({
      where: { id: firstDrawer.playerId },
    });

    if (!drawerExists) {
      throw new Error("Drawer not found");
    }

    await Promise.all([
      db.round.create({
        data: {
          gameId: game.id,
          drawerId: firstDrawer.playerId,
          word: "",
        },
      }),
      db.game.update({
        where: { id: game.id },
        data: {
          currentDrawerId: firstDrawer.playerId,
          currentRound: game.currentRound + 1,
          newTurn: true,
        },
      }),
    ]);
  } catch (err) {
    console.error("Error: ", err);
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}
