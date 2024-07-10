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

  try {
    // Find the GamePlayer record for the current user and game
    const gamePlayer = await db.gamePlayer.findUnique({
      where: {
        id: userId,
        gameId: gameId,
      },
    });

    if (!gamePlayer) {
      return { failure: 'GamePlayer not found' };
    }

    await db.gamePlayer.update({
      where: {
        id: gamePlayer.id,
      },
      data: {
        score: score,
      },
    });
  } catch (err) {
    console.error('Error updating score:', err);
    return { failure: 'Failed to update score' };
  } finally {
    revalidatePath(`/room/${gameId}`);
  }

  return { success: true };
}
