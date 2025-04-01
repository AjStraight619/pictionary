import PlayerCard from "./player-card";
import { usePlayers } from "@/hooks/useGameSelector";
import { useGameStatus } from "@/hooks/useGameSelector";
import { GameStatus } from "@/types/game";

const Lobby = () => {
  const players = usePlayers();
  const gameStatus = useGameStatus();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <h3 className="text-sm font-medium mb-3">
        {gameStatus === GameStatus.InProgress
          ? "Game in Progress"
          : "Waiting for Players"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {players.map((player) => (
          <PlayerCard
            key={player.ID}
            isHost={player.isHost}
            isDrawing={player.isDrawing}
            name={player.username}
            score={player.score}
            color={player.color}
          />
        ))}
        {players.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8 col-span-2">
            No players have joined yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
