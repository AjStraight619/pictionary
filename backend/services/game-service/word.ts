import { getGame } from "./game.ts";
import { getPlayerById } from "./player.ts";
import { broadcastToGame } from "./utils.ts";
import { Guess } from "../../models/game-model.ts";

// ! Going to use an word API or longer list of words later

export const fetchRandomWord = async (): Promise<string> => {
  const words = ["apple", "banana", "grape", "orange", "strawberry"];
  console.log("Fetching random word...");
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
    type: "new-word",
    payload: { currentWord: word },
  });
};

// Maybe we just broadcast as type gamestate so everything can update here?

export const checkGuess = (gameId: string, playerId: string, guess: string) => {
  const game = getGame(gameId);
  if (!game) return;
  //const currentWord = game?.currentWord;
  //if (!currentWord) return;
  const currentWord = "Sure";
  const player = getPlayerById(gameId, playerId);
  if (!player) return;
  if (player.guess === Guess.isCorrect) return;
  if (guess.toLowerCase() === currentWord.toLowerCase()) {
    player.guess = Guess.isCorrect;
    broadcastToGame(gameId, {
      type: "player-guess",
      payload: {
        message: `${player.name} guessed the word!`,
        username: player.name,
        guess: Guess.isCorrect,
      },
    });

    // TODO: Update player score
    return;
  }

  if (isCloseGuess(guess, currentWord)) {
    player.guess = Guess.isClose;
    broadcastToGame(gameId, {
      type: "player-guess",
      payload: {
        message: `${player.name} is close!!`,
        username: player.name,
        guess: Guess.isClose,
      },
    });
    return;
  }
  player.guess === Guess.isWrong;
  broadcastToGame(gameId, {
    type: "player-guess",
    payload: {
      message: guess,
      username: player.name,
      guess: Guess.isWrong,
    },
  });
};

const isCloseGuess = (guess: string, word: string): boolean => {
  const distance = levenshteinDistance(guess.toLowerCase(), word.toLowerCase());
  return distance <= Math.ceil(word.length / 4); // Close if within 25% of the word length
};

const levenshteinDistance = (a: string, b: string): number => {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
};
