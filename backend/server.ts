import { gameHandler } from './handlers/game-handler.ts';

Deno.serve({ port: 8000 }, req => {
  const url = new URL(req.url); // Parse the request URL
  const pathname = url.pathname; // Get the path (e.g., "/game/123")

  const segments = pathname.split('/').filter(Boolean); // Split the path into segments
  console.log('Path segments:', segments);

  if (segments[0] === 'game' && segments[1]) {
    const gameId = segments[1]; // Extract the "id" from "/game/[id]"
    console.log('Game ID:', gameId);

    return gameHandler(gameId, req);
  }

  return new Response('Not Found', { status: 404 });
});
