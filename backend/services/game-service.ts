// import { TimerType } from './../models/game-model.ts';
// import { GameState, GameTimers, Player } from '../models/game-model.ts';

// const games = new Map<string, GameState>();
// const timers = new Map<string, GameTimers>();

// export const initializeGame = (gameId: string): void => {
//   const players: Player[] = [];
//   games.set(gameId, {
//     id: gameId,
//     players,
//     currentWord: null,
//     timers: null,
//     rounds: [],
//   });
// };

// export const isCurrentGame = (gameId: string): boolean => games.has(gameId);

// export const addPlayer = (gameId: string, player: Player): void => {
//   const game = games.get(gameId);
//   if (!game) {
//     throw new Error(`Game ${gameId} not found`);
//   }

//   // Avoid duplicate entries for the same playerId
//   const existingPlayer = game.players.find(p => p.id === player.id);
//   if (existingPlayer) {
//     console.log(`Player ${player.id} already in the game, skipping add.`);
//     return;
//   }

//   game.players.push(player);
//   console.log(`Player ${player.id} added to game ${gameId}`);

//   // Broadcast to all players
//   broadcastToGame(gameId, {
//     type: 'player-joined',
//     payload: player,
//   });
// };

// export const removePlayer = (gameId: string, playerId: string): void => {
//   const game = games.get(gameId);
//   if (!game) {
//     throw new Error(`Game ${gameId} not found`);
//   }
//   const index = game.players.findIndex(player => player.id === playerId);
//   if (index !== -1) {
//     game.players.splice(index, 1);
//   }
// };

// export const getGame = (gameId: string): GameState | undefined =>
//   games.get(gameId);

// export const broadcastToGame = <T>(
//   gameId: string,
//   data: { type: string; payload: T },
// ) => {
//   const game = games.get(gameId);
//   if (!game) {
//     throw new Error(`Game ${gameId} not found`);
//   }
//   game.players.forEach(player => {
//     player.socket.send(JSON.stringify(data));
//   });

//   console.log(`Broadcasted to game ${gameId}:`, data);
// };

// export const removePlayerBySocket = (
//   gameId: string,
//   socket: WebSocket,
// ): void => {
//   const game = games.get(gameId);
//   if (!game) {
//     throw new Error(`Game ${gameId} not found`);
//   }

//   const index = game.players.findIndex(player => player.socket === socket);
//   if (index !== -1) {
//     game.players.splice(index, 1);
//   }
// };

// export const fetchRandomWord = async (): Promise<string> => {
//   const words = ['apple', 'banana', 'grape', 'orange', 'strawberry'];
//   console.log('Fetching random word...');
//   return words[Math.floor(Math.random() * words.length)];
// };

// export const updateWord = (gameId: string, word: string): void => {
//   const game = games.get(gameId);
//   if (!game) {
//     throw new Error(`Game ${gameId} not found`);
//   }

//   // Add or update the `currentWord` property in the game state
//   game.currentWord = word; // Ensure `GameState` has `currentWord` defined
//   console.log(`Updated word for game ${gameId}: ${word}`);

//   // Optionally broadcast the new word to players (e.g., to the drawer)
//   broadcastToGame(gameId, {
//     type: 'new-word',
//     payload: { currentWord: word },
//   });
// };

// export const startTimer = (
//   gameId: string,
//   type: TimerType,
//   duration: number,
//   callback: () => void,
// ) => {
//   if (!timers.has(gameId)) {
//     timers.set(gameId, {});
//   }

//   const gameTimers = timers.get(gameId)!;

//   // Prevent duplicate timers for the same type
//   if (gameTimers[type]) {
//     console.log(`Timer of type ${type} already running for game ${gameId}`);
//     return;
//   }

//   console.log(`Starting ${type} timer for game ${gameId}`);

//   const intervalId = setInterval(() => {
//     duration--;

//     // Broadcast the updated time for the timer type
//     broadcastToGame(gameId, {
//       type: `${type}-timer-update`,
//       payload: { timeRemaining: duration },
//     });

//     if (duration <= 0) {
//       clearInterval(intervalId);
//       delete gameTimers[type]; // Remove the timer from the map
//       console.log(`Timer of type ${type} for game ${gameId} ended`);

//       // Call the provided callback when the timer ends
//       callback();
//     }
//   }, 1000);

//   gameTimers[type] = intervalId; // Save the timer ID in the map
// };

// export const stopTimer = (gameId: string, type: TimerType) => {
//   const gameTimers = timers.get(gameId);
//   if (!gameTimers || !gameTimers[type]) {
//     console.log(`No ${type} timer found for game ${gameId}`);
//     return;
//   }

//   clearInterval(gameTimers[type]!); // Stop the specific timer
//   delete gameTimers[type]; // Remove the timer from the map
//   console.log(`Stopped ${type} timer for game ${gameId}`);
// };
