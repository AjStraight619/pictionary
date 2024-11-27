import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import useWebSocket, { ReadyState } from 'react-use-websocket';

function App() {
  const [count, setCount] = useState(0);
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
        console.log('message:', message);
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

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p>Connection status: {connectionStatus}</p>
    </>
  );
}

export default App;
