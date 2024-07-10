'use server';
import { db } from '@/lib/db';
import { createRoomSchema } from '@/lib/schemas';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { startNewRound } from './round';
import { startNewTurn } from './turn';
import { revalidatePath } from 'next/cache';
import { GamePlayer } from '@prisma/client';
import { StartGameData } from '@/types/game';

export async function createGame(values: z.infer<typeof createRoomSchema>) {
  const validatedValues = createRoomSchema.safeParse(values);
  if (!validatedValues.success) {
    return {
      error: 'Invalid form values',
    };
  }
  const user = await currentUser();
  if (!user || !user.id) redirect('/sign-in');

  const player = await db.player.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!player) {
    redirect('/profile/finish');
  }

  const { isOpen, roomname } = validatedValues.data;

  console.log('isOpen: ', isOpen);

  let newGame;

  try {
    newGame = await db.game.create({
      data: {
        isOpen,
        name: roomname,
        status: 'WAITING',
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
      error: 'Something went wrong',
    };
  } finally {
    if (!newGame) {
      return {
        error: 'Could not create new game',
      };
    }
    revalidatePath(`/room/${newGame.id}`);
  }
}

export async function startGame(formData: FormData) {
  const data = Object.fromEntries(formData) as unknown as StartGameData;
  const { gameId, maxPlayers, maxRounds, leader } = data;
  console.log('Data: ', data);
  console.log('Type of maxPlayers: ', typeof maxPlayers);
  const parsedLeader = JSON.parse(leader) as GamePlayer;
  console.log('Parsed leader: ', parsedLeader);
  if (!parsedLeader) {
    return { failure: 'No valid leader in game' };
  }
  try {
    await Promise.all([
      db.game.update({
        where: {
          id: gameId,
        },
        data: {
          maxPlayers: parseInt(maxPlayers),
          maxRounds: parseInt(maxRounds),
          status: 'IN_PROGRESS',
          currentDrawerId: parsedLeader.playerId,
        },
      }),
      startNewRound(gameId),
    ]);
    console.log('Started game.....');
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}

export async function joinGame(gameId: string) {
  const user = await currentUser();
  if (!user || !user.id) redirect('/sign-in');

  try {
    const player = await db.player.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!player) redirect('/profile/finish');

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
        error: 'This game does not exist',
      };
    }

    const isPlayerInGame = game.players.some(
      gamePlayer => gamePlayer.playerId === player.id,
    );

    console.log('Is player in game: ', isPlayerInGame);

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
      error: 'Something went wrong',
    };
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}

export async function proceedGame(gameId: string) {
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
        rounds: {
          orderBy: { createdAt: 'asc' },
          include: { drawer: true },
        },
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const currentDrawerIndex = game.players.findIndex(
      player => player.playerId === game.currentDrawerId,
    );

    const nextDrawerIndex = (currentDrawerIndex + 1) % game.players.length;

    if (nextDrawerIndex === 0 && currentDrawerIndex !== -1) {
      await Promise.all([startNewRound(gameId), startNewTurn(gameId)]);
    } else {
      await startNewTurn(gameId);
    }
  } catch (err) {
    console.error('error: ', err);
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}
