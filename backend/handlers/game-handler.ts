import { stopTimer } from "./../services/game-service/timer.ts";
import { broadcastToSelf } from "./../services/game-service/utils.ts";
import {
  initializeGame,
  isCurrentGame,
  addPlayer,
  getGame,
  broadcastToGame,
  startTimer,
  createPlayer,
} from "../services/game-service/index.ts";

import { checkGuess } from "../services/game-service/word.ts";
import { getAllGames, removeGameById } from "../services/game-service/game.ts";
import { removePlayer } from "../services/game-service/player.ts";
import { logInfo, logError, logDebug } from "../utils.ts";
import { Player } from "../models/game-model.ts";

export function gameHandler(
  gameId: string,
  playerId: string,
  playerName: string,
  req: Request,
) {
  if (req.headers.get("upgrade") !== "websocket") {
    logError("Invalid WebSocket upgrade request", { gameId, playerId });
    return new Response(null, { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    logInfo("Player connected", { gameId, playerId, playerName });
    const games = getAllGames();
    logInfo("Total Games: ", { totalGames: games.size });
    handlePlayerConnection(gameId, playerId, playerName, socket);
  };

  socket.onmessage = (event) => {
    if (event.data === "ping") {
      socket.send("pong");
      return;
    }

    try {
      const message = JSON.parse(event.data);
      const messageType = message.type;
      const messagePayload = message.payload;

      if (messageType === "stop-timer") {
        stopTimer(gameId, messagePayload.timerType);
      }

      if (messageType === "start-timer") {
        startTimer(gameId, messagePayload.timerType, () => {
          const timerType = messagePayload.timerType;
          if (timerType === "round") {
            broadcastToGame(gameId, {
              type: `${messagePayload.timerType}-timer-ended`,
              payload: { duration: 0 },
            });
          } else {
            broadcastToSelf(socket, {
              type: `${messagePayload.timerType}-timer-ended`,
              payload: { duration: 0 },
            });
          }
        });
        logInfo("Timer started", {
          gameId,
          timerType: messagePayload.timerType,
          duration: messagePayload.duration,
        });
      } else if (messageType === "player-guess") {
        checkGuess(gameId, playerId, messagePayload.message);
        logInfo("Player guess processed", {
          gameId,
          playerId,
          guess: messagePayload.message,
        });
      } else {
        broadcastToGame(gameId, {
          type: messageType,
          payload: messagePayload,
        });
        logInfo("Broadcasting message to game", {
          gameId,
          messageType,
          payload: messagePayload,
        });
      }
    } catch (error) {
      logError("Error handling message", { gameId, playerId, error });
    }
  };

  socket.onclose = () => {
    logInfo("Player disconnected", { gameId, playerId });

    const game = getGame(gameId);
    if (!game) return;

    const player = game.players.find((p) => p.id === playerId);
    if (!player) return;

    handlePlayerDisconnection(gameId, player);
  };

  socket.onerror = (error) => {
    logError("WebSocket error occurred", { gameId, playerId, error });
  };

  return response;
}

function handlePlayerConnection(
  gameId: string,
  playerId: string,
  playerName: string,
  socket: WebSocket,
) {
  const game = getGame(gameId);

  if (!game) {
    logError("Game not found", { gameId });
    return;
  }

  const existingPlayer = game.players.find((p) => p.id === playerId);

  if (existingPlayer) {
    if (existingPlayer.disconnected) {
      logInfo("Player reconnected within timeout period", { gameId, playerId });

      // Clear the timeout
      if (existingPlayer.reconnectionTimeoutId) {
        clearTimeout(existingPlayer.reconnectionTimeoutId);
        delete existingPlayer.reconnectionTimeoutId;
      }

      // Update the socket and reconnect the player
      existingPlayer.socket = socket;
      existingPlayer.disconnected = false;

      logInfo("Player reconnected", { gameId, playerId });
    } else {
      logInfo("Player already connected", { gameId, playerId });
    }
  } else {
    const newPlayer = createPlayer(playerName, playerId, socket, false);
    addPlayer(gameId, newPlayer);
    logInfo("New player added", { gameId, playerId, playerName });
  }

  broadcastToGame(gameId, { type: "game-state", payload: game });
  logDebug("Game state broadcasted", { gameId, game });
}

function handlePlayerDisconnection(gameId: string, player: Player) {
  // Mark as disconnected
  player.disconnected = true;
  logInfo("Player marked as disconnected", { gameId, playerId: player.id });

  // Set a 20-second timeout for cleanup
  player.reconnectionTimeoutId = setTimeout(() => {
    logInfo("Reconnection period expired, removing player", {
      gameId,
      playerId: player.id,
    });

    removePlayer(gameId, player.id);

    const game = getGame(gameId);
    if (!game) return;

    const remainingPlayers = game.players.length;

    if (remainingPlayers === 0) {
      logInfo("No players remaining, removing game", { gameId });
      removeGameById(gameId);
    } else {
      broadcastToGame(gameId, {
        type: "game-state",
        payload: game,
      });
      logInfo("Updated player list broadcasted", { gameId });
    }

    logDebug("Remaining players in game", { gameId, remainingPlayers });
    const games = getAllGames();
    const totalGames = games.size;
    logDebug("Total number of games: ", { totalGames });
  }, 20000); // 20 seconds
}

function handleMessage(
  gameId: string,
  playerId: string,
  socket: WebSocket,
  message: any,
) {
  const { type: messageType, payload: messagePayload } = message;

  logDebug("Message received", { gameId, playerId, messageType, message });

  switch (messageType) {
    case "stop-timer":
      stopTimer(gameId, messagePayload.timerType);
      break;

    case "start-timer":
      startTimer(gameId, messagePayload.timerType, () => {
        const timerType = messagePayload.timerType;
        const endMessage = {
          type: `${messagePayload.timerType}-timer-ended`,
          payload: { duration: 0 },
        };

        if (timerType === "round") {
          broadcastToGame(gameId, endMessage);
        } else {
          broadcastToSelf(socket, endMessage);
        }
      });
      logInfo("Timer started", {
        gameId,
        timerType: messagePayload.timerType,
        duration: messagePayload.duration,
      });
      break;

    case "player-guess":
      checkGuess(gameId, playerId, messagePayload.message);
      logInfo("Player guess processed", {
        gameId,
        playerId,
        guess: messagePayload.message,
      });
      break;

    default:
      broadcastToGame(gameId, { type: messageType, payload: messagePayload });
      logInfo("Broadcasting message to game", {
        gameId,
        messageType,
        payload: messagePayload,
      });
  }
}
