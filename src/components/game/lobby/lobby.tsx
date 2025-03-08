import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

import { useEffect } from "react";
import PlayerCard from "./player-card";
import { useGame } from "@/providers/game-provider";

const Lobby = () => {
  const { players, setPlayers } = useGame();

  const { lastMessage, connectionStatus } = useCustomWebsocket({
    messageTypes: ["gameState"],
  });

  //const { lastMessage, connectionStatus } = useGame();
  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data);
      const messageType = parsedMessage.type;

      console.log("parsedMessage: ", parsedMessage);

      switch (messageType) {
        case "playerJoined":
          setPlayers((prevPlayers) => [...prevPlayers, parsedMessage.payload]);
          break;

        case "playerLeft": {
          const playerLeftId = parsedMessage.payload;
          const filteredPlayers = players.filter(
            (p) => p.playerID !== playerLeftId,
          );
          setPlayers(filteredPlayers);
          break;
        }

        case "gameState": {
          const allPlayers = parsedMessage.payload.gameState.players;
          setPlayers(allPlayers);
          break;
        }

        default:
          return;
      }
    }
  }, [lastMessage]);

  return (
    <Card className="flex-1 min-h-full max-h-full flex-shrink-0">
      <CardHeader>
        <CardTitle>Lobby</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 grid-rows-2 gap-2 grid-flow-row">
          {players.map((player) => (
            <PlayerCard
              key={player.playerID}
              isHost={player.isHost}
              isDrawing={player.isDrawing}
              name={player.username}
              connectionStatus={connectionStatus}
              score={player.score}
              color={player.color}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Lobby;
