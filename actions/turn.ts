'use server';

import { db } from '@/lib/db';

import { revalidatePath } from 'next/cache';
import { getNextDrawer } from './game';

export async function startNewTurn(gameId: string) {
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
        rounds: {},
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    const nextDrawer = await getNextDrawer(game.id);

    console.log('Next Drawer: ', nextDrawer);

    await db.game.update({
      where: { id: game.id },
      data: {
        newTurn: true,
        rounds: {},
      },
    });

    return nextDrawer;
  } catch (err) {
    console.error('Something went wrong starting a new turn: ', err);
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}
