import { Player } from "../../models/game-model.ts";
import { broadcastToGame } from "./utils.ts";
import { getGame } from "./game.ts";

const COLORS = [
  "#FF5733", // Red-Orange
  "#33FF57", // Lime Green
  "#3357FF", // Blue
  "#FF33A6", // Pink
  "#FFFF33", // Yellow
  "#33FFF5", // Cyan
  "#A633FF", // Purple
  "#FF8C33", // Orange
];

function assignUniqueColor(players: Player[]): string {
  const usedColors = new Set(players.map((player) => player.color)); // Colors already assigned
  const availableColor = COLORS.find((color) => !usedColors.has(color));
  if (availableColor) return availableColor;

  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`;
}

export const createPlayer = (
  playerName: string,
  playerId: string,
  socket: WebSocket | null = null,
  isLeader: boolean,
): Player => {
  return {
    id: playerId,
    name: playerName,
    socket: socket,
    color: "",
    score: 0,
    isDrawing: false,
    isLeader: isLeader,
    disconnected: false,
  };
};

export const addPlayer = (gameId: string, player: Player): void => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const existingPlayer = game.players.find((p) => p.id === player.id);
  if (existingPlayer) {
    console.log(`Player ${player.id} already in the game, skipping add.`);
    return;
  }

  // Assign a unique color
  const color = assignUniqueColor(game.players);

  // Add the player with the unique color
  game.players.push({ ...player, color });
  console.log(
    `Player ${player.id} added to game ${gameId} with color ${color}`,
  );
  broadcastToGame(gameId, {
    type: "player-joined",
    payload: { ...player, color },
  });
};

export const removePlayer = (gameId: string, playerId: string): void => {
  const game = getGame(gameId);
  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const index = game.players.findIndex((player) => player.id === playerId);
  if (index !== -1) {
    console.log(`Removing player ${playerId} from game ${gameId}`);
    game.players.splice(index, 1);
    broadcastToGame(gameId, { type: "player-left", payload: { playerId } });
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

  const index = game.players.findIndex((player) => player.socket === socket);
  if (index !== -1) {
    const removedPlayer = game.players.splice(index, 1)[0];
    console.log(`Removing player ${removedPlayer.id} from game ${gameId}`);
    broadcastToGame(gameId, {
      type: "player-left",
      payload: { playerId: removedPlayer.id },
    });
  }
};

export const getPlayerById = (gameId: string, playerId: string) => {
  const game = getGame(gameId);
  if (!game) return;
  const player = game.players.find((p) => p.id === playerId);
  return player;
};
