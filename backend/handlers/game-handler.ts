import { removePlayerBySocket } from './../services/game-service.ts';
import {
  initializeGame,
  isCurrentGame,
  addPlayer,
  removePlayer,
  getGame,
  broadcastToGame,
} from '../services/game-service.ts';

import { Player } from '../models/game-model.ts';

export function gameHandler(gameId: string, req: Request) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response(null, { status: 400 });
  }

  if (!isCurrentGame(gameId)) {
    initializeGame(gameId);
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  const newPlayer: Player = {
    id: crypto.randomUUID(),
    name: `Player_${Math.floor(Math.random() * 1000)}`,
    score: 0,
    socket,
  };

  socket.onopen = () => {
    console.log(`Player connected to game ${gameId}`);
    addPlayer(gameId, newPlayer);

    // Broadcast updated player list to all players in the game
    broadcastToGame(gameId, {
      event: 'player-list',
      payload: getGame(gameId)?.players || [],
    });
  };

  socket.onmessage = event => {
    console.log(`Message received in game ${gameId}:`, event.data);

    if (event.data === 'ping') {
      socket.send('pong');
    }
  };

  socket.onclose = () => {
    console.log(`Player disconnected from game ${gameId}`);
    removePlayerBySocket(gameId, socket);

    // Broadcast updated player list to remaining players
    broadcastToGame(gameId, {
      event: 'player-list',
      payload: getGame(gameId)?.players || [],
    });

    console.log(
      `Remaining players in game ${gameId}:`,
      getGame(gameId)?.players.length || 0,
    );
  };

  return response;
}
