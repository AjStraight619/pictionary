import { GameState, Player } from '../models/game-model.ts';

const games = new Map<string, GameState>();

export const initializeGame = (gameId: string): void => {
  const players: Player[] = [];
  games.set(gameId, { id: gameId, players, rounds: [] });
};

export const isCurrentGame = (gameId: string): boolean => games.has(gameId);

export const addPlayer = (gameId: string, player: Player): void => {
  const game = games.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }
  game.players.push(player);
  game.players.forEach(player => {
    player.socket.send(JSON.stringify('Player joined'));
  });
  game.players.forEach(player => {
    broadcastToGame(gameId, {
      event: 'player-joined',
      payload: player,
    });
  });
};

export const removePlayer = (gameId: string, playerId: string): void => {
  const game = games.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }
  const index = game.players.findIndex(player => player.id === playerId);
  if (index !== -1) {
    game.players.splice(index, 1);
  }
};

export const getGame = (gameId: string): GameState | undefined =>
  games.get(gameId);

export const broadcastToGame = <T>(
  gameId: string,
  data: { event: string; payload: T },
) => {
  const game = games.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }
  game.players.forEach(player => {
    player.socket.send(JSON.stringify(data));
  });

  console.log(`Broadcasted to game ${gameId}:`, data);
};

export const removePlayerBySocket = (
  gameId: string,
  socket: WebSocket,
): void => {
  const game = games.get(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const index = game.players.findIndex(player => player.socket === socket);
  if (index !== -1) {
    game.players.splice(index, 1);
  }
};
