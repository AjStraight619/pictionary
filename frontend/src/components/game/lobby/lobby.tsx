import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';

import { Player } from '@/types/lobby';
import { useEffect, useRef, useState } from 'react';

const Lobby = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const ref = useRef(0);

  useEffect(() => {
    ref.current++;
    console.log('Lobby component re-rendered: ', ref.current);
  });

  const { lastMessage } = useCustomWebsocket({
    messageTypes: ['game-state'],
  });

  useEffect(() => {
    if (lastMessage) {
      const newPlayers = JSON.parse(lastMessage.data).payload
        .players as Player[];
      setPlayers(newPlayers);
    }
  }, [lastMessage]);

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Lobby</CardTitle>
      </CardHeader>
      <CardContent>
        {players.map(player => (
          <div key={player.id}>{player.name}</div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Lobby;
