import { Player } from '../../models/game-model.ts';
import { broadcastToGame } from './utils.ts';
import { getGame } from './game.ts';

export const addPlayer = (gameId: string, player: Player): void => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const existingPlayer = game.players.find(p => p.id === player.id);
  if (existingPlayer) {
    console.log(`Player ${player.id} already in the game, skipping add.`);
    return;
  }

  game.players.push(player);
  console.log(`Player ${player.id} added to game ${gameId}`);
  broadcastToGame(gameId, { type: 'player-joined', payload: player });
};

export const removePlayer = (gameId: string, playerId: string): void => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const index = game.players.findIndex(player => player.id === playerId);
  if (index !== -1) {
    game.players.splice(index, 1);
  }
};

export const removePlayerBySocket = (
  gameId: string,
  socket: WebSocket,
): void => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const index = game.players.findIndex(player => player.socket === socket);
  if (index !== -1) {
    game.players.splice(index, 1);
  }
};
