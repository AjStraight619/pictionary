export function gameHandler(gameId: string, req: Request) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response(null, { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log('Socket opened');
    socket.send(`Hello, game ${gameId}!`);
  };

  socket.onmessage = event => {
    console.log('Message received:', event.data);
    if (event.data === 'ping') {
      socket.send('pong');
      return;
    }
    socket.send(`You said: ${event.data}`);
  };

  socket.onclose = () => {
    console.log('Socket closed');
  };

  socket.onerror = event => {
    console.error('Socket error:', event);
  };

  return response;
}
