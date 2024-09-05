'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function startNewRound(gameId: string) {
  console.log('Start new round called');
  try {
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        players: true,
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.players.length === 0) {
      throw new Error('No players found in the game');
    }

    // Get the first player in the game (this should be a GamePlayer)
    const firstDrawer = game.players[0];

    console.log('First drawer (GamePlayer): ', firstDrawer);

    // Ensure that the drawer is a valid GamePlayer (check if GamePlayer exists)
    const drawerExists = await db.gamePlayer.findUnique({
      where: { id: firstDrawer.id }, // Use the GamePlayer ID here, not Player's playerId
    });

    if (!drawerExists) {
      throw new Error('Drawer (GamePlayer) not found');
    }

    // Reset all players' guessing status for the new round
    await db.gamePlayer.updateMany({
      where: { gameId: game.id },
      data: { hasGuessedCorrectly: false },
    });

    // Create a new round and update the game status
    await Promise.all([
      db.round.create({
        data: {
          gameId: game.id,
          drawerId: firstDrawer.id, // Use GamePlayer's ID for the drawer
          word: '', // Placeholder for the word to be guessed
        },
      }),
      db.game.update({
        where: { id: game.id },
        data: {
          currentRound: game.currentRound + 1,
          newTurn: true,
        },
      }),
    ]);
  } catch (err) {
    console.error('Error: ', err);
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}
