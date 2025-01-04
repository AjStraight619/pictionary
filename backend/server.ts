import {
  fetchRandomWord,
  getGame,
  updateWord,
} from "./services/game-service/index.ts";
import { gameHandler } from "./handlers/game-handler.ts";
import { createGameHandler } from "./handlers/create-game-handler.ts";
import { withCors } from "./utils.ts";

Deno.serve({ port: 8000 }, async (req: Request) => {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const method = req.method;
  console.log("Query params: ", queryParams);
  const userId = queryParams.userId as string;
  const username = queryParams.username as string;
  console.log("userId: ", userId);
  console.log("username: ", username);

  console.log("new req: ", JSON.stringify(req, null, 2));

  // Handle CORS Preflight Requests
  if (method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  // Handle WebSocket connections
  if (segments[0] === "game" && segments[1] && !segments[2]) {
    const gameId = segments[1];
    console.log("userId: ", userId);
    console.log("username: ", username);
    return gameHandler(gameId, userId, username, req);
  }

  if (method === "POST" && segments[0] === "create-game") {
    console.log("creating game...");
    return createGameHandler(req);
  }
  // Handle GET request for a word
  if (method === "GET" && segments[0] === "game" && segments[2] === "word") {
    const gameId = segments[1];
    console.log("In GET /game/:id/word method");

    const game = getGame(gameId);
    if (!game) {
      return withCors(new Response("Game not found", { status: 404 }));
    }

    const word = await fetchRandomWord();
    updateWord(gameId, word);

    return withCors(
      new Response(JSON.stringify({ word }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  // Fallback for unmatched routes
  return withCors(new Response("Not Found", { status: 404 }));
});
