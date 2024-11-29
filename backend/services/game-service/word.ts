import { getGame } from './game.ts';
import { broadcastToGame } from './utils.ts';

// ! Going to use an word API or longer list of words later

export const fetchRandomWord = async (): Promise<string> => {
  const words = ['apple', 'banana', 'grape', 'orange', 'strawberry'];
  console.log('Fetching random word...');
  return words[Math.floor(Math.random() * words.length)];
};

export const updateWord = (gameId: string, word: string): void => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  game.currentWord = word;
  console.log(`Updated word for game ${gameId}: ${word}`);

  broadcastToGame(gameId, {
    type: 'new-word',
    payload: { currentWord: word },
  });
};
