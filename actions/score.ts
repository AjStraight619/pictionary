'use server';

import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function updateScore(score: number, gameId: string) {
  const user = await currentUser();
  if (!user || !user.id) {
    return { failure: 'User not authenticated' };
  }

  const userId = user.id;

  console.log('In update score');

  try {
    const game = await db.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        players: {
          select: {
            id: true,
            playerId: true,
            score: true,
          },
        },
      },
    });

    if (!game) {
      return { failure: 'Game does not exist' };
    }

    const player = game.players.find(p => p.playerId === userId);
    if (!player) {
      console.log('This player does not exist');
      return { failure: 'Player does not exist in game.' };
    }

    await db.gamePlayer.update({
      where: {
        id: player.id,
      },
      data: {
        score: player.score + score,
      },
    });
  } catch (err) {
    console.error('Error updating score:', err);
    return { failure: 'Failed to update score' };
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}
