import { getGame } from './game.ts';

export const broadcastToGame = <T>(
  gameId: string,
  data: { type: string; payload: T },
) => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }
  game.players.forEach(player => {
    player.socket.send(JSON.stringify(data));
  });

  console.log(`Broadcasted to game ${gameId}:`, data);
};

export const broadcastToOthers = <T>(
  gameId: string,
  senderSocket: WebSocket,
  data: { type: string; payload: T },
) => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  // Broadcast to all players except the sender
  game.players.forEach(player => {
    if (player.socket !== senderSocket) {
      player.socket.send(JSON.stringify(data));
    }
  });

  console.log(`Broadcasted to others in game ${gameId}:`, data);
};
