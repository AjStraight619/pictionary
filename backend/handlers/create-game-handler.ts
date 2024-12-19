import { logInfo } from './../utils.ts';
import { initializeGameWithLeader } from '../services/game-service/game.ts';
import { createPlayer } from '../services/game-service/player.ts';
import { withCors } from '../utils.ts';

export const createGameHandler = async (req: Request) => {
  try {
    const body = await req.json(); // Parse JSON safely
    const { gameId, playerId, playerName, gameOptions } = body;

    // Ensure required fields exist
    if (!gameId || !playerId || !playerName) {
      return withCors(
        new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    }

    // Create game
    const player = createPlayer(playerName, playerId, null, true);
    logInfo('Player Added: ', { player });
    const newGame = initializeGameWithLeader(gameId, player, gameOptions);
    // addPlayer(gameId, player);

    logInfo('New Game', { newGame });

    // Success response
    return withCors(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  } catch (error) {
    console.error('Error in createGameHandler:', error);

    // Handle JSON parsing errors or unexpected exceptions
    return withCors(
      new Response(
        JSON.stringify({ error: 'Invalid request or server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }
};
