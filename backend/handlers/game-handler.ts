import {
  initializeGame,
  isCurrentGame,
  addPlayer,
  getGame,
  broadcastToGame,
  startTimer,
  createPlayer,
} from '../services/game-service/index.ts';

import { checkGuess } from '../services/game-service/word.ts';
import { getAllGames, removeGame } from '../services/game-service/game.ts';
import { removePlayer } from '../services/game-service/player.ts';
import { logInfo, logError, logDebug } from '../utils.ts';

export function gameHandler(
  gameId: string,
  playerId: string,
  playerName: string,
  req: Request,
) {
  if (req.headers.get('upgrade') !== 'websocket') {
    logError('Invalid WebSocket upgrade request', { gameId, playerId });
    return new Response(null, { status: 400 });
  }

  if (!isCurrentGame(gameId)) {
    initializeGame(gameId);
    logInfo('Game initialized', { gameId });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    logInfo('Player connected', { gameId, playerId, playerName });

    const game = getGame(gameId);
    if (!game) {
      logError('Game not found', { gameId });
      return;
    }

    const allGames = getAllGames();
    logDebug('All games state', { totalGames: allGames.size });

    logDebug('Game state after socket open', { gameId, game });

    // Check if the player is reconnecting
    const existingPlayer = game.players.find(p => p.id === playerId);
    if (existingPlayer) {
      logInfo('Player reconnected', { gameId, playerId });
      existingPlayer.socket = socket; // Update the WebSocket reference
    } else {
      const newPlayer = createPlayer(playerName, playerId, socket, false);
      addPlayer(gameId, newPlayer);
      logInfo('New player added', { gameId, playerId, playerName });
    }

    // Broadcast the updated game state to all players
    broadcastToGame(gameId, {
      type: 'game-state',
      payload: game,
    });
    logDebug('Game state broadcasted', { gameId, game });
  };

  socket.onmessage = event => {
    if (event.data === 'ping') {
      socket.send('pong');
      // logDebug('Ping received, pong sent', { gameId, playerId });
      return;
    }

    try {
      const message = JSON.parse(event.data);
      const messageType = message.type;
      const messagePayload = message.payload;

      logDebug('Message received', {
        gameId,
        playerId,
        messageType,
        message,
      });

      if (messageType === 'start-timer') {
        startTimer(
          gameId,
          messagePayload.timerType,
          messagePayload.duration,
          () => {
            broadcastToGame(gameId, {
              type: `${messagePayload.timerType}-timer-ended`,
              payload: { duration: 0 },
            });
          },
        );
        logInfo('Timer started', {
          gameId,
          timerType: messagePayload.timerType,
          duration: messagePayload.duration,
        });
      } else if (messageType === 'player-guess') {
        checkGuess(gameId, playerId, messagePayload.message);
        logInfo('Player guess processed', {
          gameId,
          playerId,
          guess: messagePayload.message,
        });
      } else {
        broadcastToGame(gameId, {
          type: messageType,
          payload: messagePayload,
        });
        logInfo('Broadcasting message to game', {
          gameId,
          messageType,
          payload: messagePayload,
        });
      }
    } catch (error) {
      logError('Error handling message', { gameId, playerId, error });
    }
  };

  socket.onclose = () => {
    logInfo('Player disconnected', { gameId, playerId });

    removePlayer(gameId, playerId);

    const remainingPlayers = getGame(gameId)?.players.length || 0;
    if (remainingPlayers === 0) {
      logInfo('No players remaining, removing game', { gameId });
      removeGame(gameId);
    } else {
      broadcastToGame(gameId, {
        type: 'player-list',
        payload: getGame(gameId)?.players || [],
      });
      logInfo('Updated player list broadcasted', { gameId });
    }

    logDebug('Remaining players in game', {
      gameId,
      remainingPlayers,
    });
  };

  socket.onerror = error => {
    logError('WebSocket error occurred', { gameId, playerId, error });
  };

  return response;
}
