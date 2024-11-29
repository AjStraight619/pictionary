import {
  fetchRandomWord,
  getGame,
  updateWord,
} from './services/game-service/index.ts';
import { gameHandler } from './handlers/game-handler.ts';

function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

  return new Response(response.body, {
    ...response,
    headers: newHeaders,
  });
}

Deno.serve({ port: 8000 }, async req => {
  const url = new URL(req.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const method = req.method;
  console.log('Query params: ', queryParams);
  const playerId = queryParams.playerId as string;
  const playerName = queryParams.playerName as string;

  // Handle CORS Preflight Requests
  if (method === 'OPTIONS') {
    return withCors(new Response(null, { status: 204 }));
  }

  // Handle WebSocket connections
  if (segments[0] === 'game' && segments[1] && !segments[2]) {
    const gameId = segments[1];
    return gameHandler(gameId, playerId, playerName, req);
  }

  // Handle GET request for a word
  if (method === 'GET' && segments[0] === 'game' && segments[2] === 'word') {
    const gameId = segments[1];
    console.log('In GET /game/:id/word method');

    const game = getGame(gameId);
    if (!game) {
      return withCors(new Response('Game not found', { status: 404 }));
    }

    const word = await fetchRandomWord();
    updateWord(gameId, word);

    return withCors(
      new Response(JSON.stringify({ word }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }

  // Fallback for unmatched routes
  return withCors(new Response('Not Found', { status: 404 }));
});
