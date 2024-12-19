import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';

import { Player } from '@/types/lobby';
import { useEffect, useRef, useState } from 'react';
import PlayerCard from './player-card';

const Lobby = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const ref = useRef(0);

  useEffect(() => {
    ref.current++;
    console.log('Lobby component re-rendered: ', ref.current);
  });

  const { lastMessage, connectionStatus } = useCustomWebsocket({
    messageTypes: ['game-state', 'player-list'],
  });

  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data)
      console.log("Parsed message type: ", parsedMessage.type)
      const players = parsedMessage.payload.players
      console.log("Players: ", players)
      setPlayers(players)
    }
  }, [lastMessage]);

  //const repeatedPlayers = Array(8)
  //  .fill(players)
  //  .flat()
  //  .map((player, index) => ({ ...player, id: `${player.id}-${index}` }));
  return (
    <Card className="flex-1 flex-shrink-0">
      <CardHeader>
        <CardTitle>Lobby</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 grid-rows-2 gap-2 grid-flow-row">

          {players.map(player => (
            <PlayerCard key={player.id} name={player.name} connectionStatus={connectionStatus} score={player.score} color={player.color} />
          ))}

        </div>
      </CardContent>
    </Card>
  );
};

export default Lobby;
