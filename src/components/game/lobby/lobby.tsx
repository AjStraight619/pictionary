import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

import { useEffect } from "react";
import PlayerCard from "./player-card";
import { useGame } from "@/providers/game-provider";

const Lobby = () => {
  const { state, dispatch } = useGame();

  const { lastMessage, connectionStatus } = useCustomWebsocket({
    messageTypes: ["gameState", "drawingPlayerChanged"],
  });

  //const { lastMessage, connectionStatus } = useGame();
  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data);
      const messageType = parsedMessage.type;

      console.log("parsedMessage: ", parsedMessage);

      switch (messageType) {
        //case "playerJoined":
        //  setPlayers((prevPlayers) => [...prevPlayers, parsedMessage.payload]);
        //  break;

        //case "playerLeft": {
        //  const playerLeftId = parsedMessage.payload;
        //  const filteredPlayers = players.filter(
        //    (p) => p.playerID !== playerLeftId,
        //  );
        //  setPlayers(filteredPlayers);
        //  break;
        //}

        //case "drawingPlayerChanged": {
        //  setPlayers((prevPlayers) =>
        //    prevPlayers.map((player) => ({
        //      ...player,
        //      isDrawing:
        //        player.playerID === parsedMessage.payload.drawingPlayerID,
        //    })),
        //  );
        //  break;
        //}

        case "gameState": {
          console.log("gameState: ", parsedMessage.payload.gameState);
          dispatch({
            type: "GAME_STATE_UPDATE",
            payload: parsedMessage.payload.gameState,
          });
          //setPlayers(allPlayers);
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
          {state.players.map((player) => (
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
