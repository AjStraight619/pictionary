// import { removePlayerBySocket } from './../services/game-service.ts';
import {
  initializeGame,
  isCurrentGame,
  addPlayer,
  getGame,
  broadcastToGame,
  removePlayerBySocket,
  startTimer,
} from '../services/game-service/index.ts';

import { Player } from '../models/game-model.ts';

export function gameHandler(
  gameId: string,
  playerId: string,
  playerName: string,
  req: Request,
) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response(null, { status: 400 });
  }

  if (!isCurrentGame(gameId)) {
    initializeGame(gameId);
  }

  console.log('Player ID:', playerId);
  console.log('Game ID:', gameId);

  const { socket, response } = Deno.upgradeWebSocket(req);

  // Always create a new player for now (rollback to working logic)
  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    socket,
  };

  socket.onopen = () => {
    console.log(`Player connected to game ${gameId}`);
    addPlayer(gameId, newPlayer);

    const game = getGame(gameId);

    // Broadcast the updated game state to all players
    broadcastToGame(gameId, {
      type: 'game-state',
      payload: game,
    });
  };

  socket.onmessage = event => {
    if (event.data === 'ping') {
      socket.send('pong');
      return;
    }

    const messageType = JSON.parse(event.data).type;
    const messagePayload = JSON.parse(event.data).payload;
    console.log('messageType:', messageType);

    if (messageType === 'start-timer') {
      startTimer(
        gameId,
        messagePayload.timerType,
        messagePayload.duration,
        () => {
          broadcastToGame(gameId, {
            type: `${messagePayload.timerType}-timer-ended`,
            payload: { duraton: 0 },
          });
        },
      );
    }

    broadcastToGame(gameId, {
      type: messageType,
      payload: messagePayload,
    });
  };

  socket.onclose = () => {
    console.log(`Player disconnected from game ${gameId}`);
    removePlayerBySocket(gameId, socket);

    broadcastToGame(gameId, {
      type: 'player-list',
      payload: getGame(gameId)?.players || [],
    });

    console.log(
      `Remaining players in game ${gameId}:`,
      getGame(gameId)?.players.length || 0,
    );
  };

  return response;
}
