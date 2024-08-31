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

    // const players = game.players;
    // const currentDrawerIndex = players.findIndex(
    //   player => player.playerId === game.currentDrawerId,
    // );

    // // Determine the next drawer index
    // let nextDrawerIndex = (currentDrawerIndex + 1) % players.length;

    // // If the currentDrawerId is not found, start with the first player
    // if (currentDrawerIndex === -1) {
    //   nextDrawerIndex = 0;
    // }

    // const nextDrawer = players[nextDrawerIndex];

    // console.log('Next drawer (startNewRound): ', nextDrawer);

    // Update the game with the next drawer and set newTurn to true

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
