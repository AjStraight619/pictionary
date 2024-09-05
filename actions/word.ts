'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function setWordForRound(
  gameId: string,
  roundId: string,
  word: string,
) {
  try {
    // const [existingRound] = await Promise.all([
    //   db.round.findUnique({
    //     where: {
    //       id: roundId,
    //     },
    //   }),
    //   // Might add more here later
    // ]);

    // if (!existingRound) {
    //   await startNewRound(gameId);
    // }

    await Promise.all([
      db.round.update({
        where: { id: roundId },
        data: { word: word },
      }),
      db.game.update({
        where: { id: gameId },
        data: { newTurn: false },
      }),
    ]);
  } catch (error) {
    console.error('Error setting word for round: ', error);
  } finally {
    revalidatePath(`/room/${gameId}`);
  }
}

export async function addWordToUsedList(gameId: string, word: string) {
  try {
    await db.game.update({
      where: {
        id: gameId,
      },
      data: {
        usedWords: {
          push: word,
        },
      },
    });
  } catch (err) {
    console.log('Error: ', err);
  }
}
