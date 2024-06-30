// actions/game.ts
"use server";

import { db } from "@/lib/db";
import { createRoomSchema } from "@/lib/schemas";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startNewRound } from "./round";
import { startNewTurn } from "./turn";
import { revalidatePath } from "next/cache";

export async function createGame(values: z.infer<typeof createRoomSchema>) {
  const validatedValues = createRoomSchema.safeParse(values);
  if (!validatedValues.success) {
    return {
      error: "Invalid form values",
    };
  }
  const user = await currentUser();
  if (!user || !user.id) redirect("/sign-in");

  const player = await db.player.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!player) {
    redirect("/profile/finish");
  }

  const { isOpen, roomname } = validatedValues.data;

  try {
    const newGame = await db.game.create({
      data: {
        isOpen,
        name: roomname,
        status: "WAITING",
        currentRound: 0,
        players: {
          create: {
            playerId: player.id,
            score: 0,
            isLeader: true,
            username: player.username,
          },
        },
      },
    });

    return {
      success: {
        ok: true,
        room: newGame.id,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      error: "Something went wrong",
    };
  }
}

export async function joinGame(gameId: string) {
  const user = await currentUser();
  if (!user || !user.id) redirect("/sign-in");

  try {
    const player = await db.player.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!player) redirect("/profile/finish");

    const game = await db.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        players: true,
      },
    });

    if (!game) {
      return {
        error: "This game does not exist",
      };
    }

    const isPlayerInGame = game.players.some(
      (gamePlayer) => gamePlayer.playerId === player.id
    );

    console.log("Is player in game: ", isPlayerInGame);

    if (!isPlayerInGame) {
      await db.gamePlayer.create({
        data: {
          gameId: game.id,
          playerId: player.id,
          username: player.username,
        },
      });
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error(err);
    return {
      error: "Something went wrong",
    };
  } finally {
    revalidatePath("/room/[roomId]", "page");
  }
}

export async function proceedGame(gameId: string) {
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
        rounds: {
          orderBy: { createdAt: "asc" },
          include: { drawer: true },
        },
      },
    });

    if (!game) {
      throw new Error("Game not found");
    }

    const currentDrawerIndex = game.players.findIndex(
      (player) => player.id === game.currentDrawerId
    );

    const nextDrawerIndex = (currentDrawerIndex + 1) % game.players.length;

    if (nextDrawerIndex === 0 && currentDrawerIndex !== -1) {
      await startNewRound(gameId);
      await startNewTurn(gameId);
    } else {
      await startNewTurn(gameId);
    }
  } catch (err) {
    console.error("error: ", err);
  } finally {
    revalidatePath("/room/[roomId]", "page");
  }
}

// export async function initializeGame(
//   roomId: string,
//   playerId: string,
//   username: string
// ) {
//   const game = await db.game.create({
//     data: {
//       status: "WAITING",
//       currentRound: 0,
//       players: {
//         create: {
//           playerId: playerId,
//           score: 0,
//           isLeader: true,
//           username: username,
//         },
//       },
//       rounds: {
//         create: {
//           drawerId: playerId,
//           word: "",
//         },
//       },
//     },
//     include: {
//       players: true,
//       rounds: true,
//     },
//   });

//   return game;
// }

// export async function addPlayerToGame(
//   gameId: string,
//   playerId: string,
//   username: string
// ) {
//   await db.gamePlayer.create({
//     data: {
//       gameId: gameId,
//       playerId: playerId,
//       username: username,
//       score: 0,
//       isLeader: false,
//     },
//   });

//   const updatedGame = await db.game.findUnique({
//     where: { id: gameId },
//     include: { players: true, rounds: true },
//   });

//   return updatedGame;
// }
