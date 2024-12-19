import { getGame } from "./game.ts";

export const broadcastToGame = <T>(
  gameId: string,
  data: { type: string; payload: T },
) => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  game.players.forEach((player) => {
    if (!player.socket) return;
    if (player.socket.readyState === WebSocket.OPEN) {
      try {
        player.socket.send(JSON.stringify(data));
      } catch (err) {
        console.error(`Error sending message to player ${player.id}:`, err);
      }
    } else {
      console.warn(
        `Socket for player ${player.id} is not open. Skipping broadcast.`,
      );
    }
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
  game.players.forEach((player) => {
    if (!player.socket) return;
    if (
      player.socket !== senderSocket &&
      player.socket.readyState === WebSocket.OPEN
    ) {
      try {
        player.socket.send(JSON.stringify(data));
      } catch (err) {
        console.error(`Error sending message to player ${player.id}:`, err);
      }
    } else if (player.socket.readyState !== WebSocket.OPEN) {
      console.warn(
        `Socket for player ${player.id} is not open. Skipping broadcast.`,
      );
    }
  });

  console.log(`Broadcasted to others in game ${gameId}:`, data);
};

export const broadcastToSelf = <T>(
  playerSocket: WebSocket,
  data: { type: string; payload: T },
) => {
  if (!playerSocket || playerSocket.readyState !== WebSocket.OPEN) {
    console.warn(`Socket is not open. Skipping broadcast to self.`);
    return;
  }

  try {
    playerSocket.send(JSON.stringify(data));
    console.log(`Broadcasted to self:`, data);
  } catch (err) {
    console.error(`Error sending message to self:`, err);
  }
};
