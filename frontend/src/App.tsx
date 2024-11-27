import { useEffect, useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import CanvasComponent from './components/canvas/canvas';

function App() {
  const [count, setCount] = useState(0);
  const [players, setPlayers] = useState<any[]>([]);
  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    'ws://localhost:8000/game/123',
    {
      onOpen: () => console.log('opened'),
      onClose: () => console.log('closed'),
      onError: () => console.log('error'),
      heartbeat: {
        interval: 5000,
        message: 'ping',
        returnMessage: 'pong',
      },
      filter: message => {
        console.log('message:', message.data);
        return true;
      },
    },
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      switch (message.event) {
        case 'player-joined':
          setPlayers(players => [...players, message.payload]);
          break;
        default:
          console.log('Unhandled message:', message);
      }
    }
  }, [lastMessage]);

  return (
    <main className="flex flex-col min-h-screen items-center justify-center">
      <CanvasComponent />
    </main>
  );
}

export default App;
