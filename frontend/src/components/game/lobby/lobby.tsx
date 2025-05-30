import PlayerCard from "./player-card";
import { usePlayers } from "@/hooks/useGameSelector";

const Lobby = ({ isPreGame }: { isPreGame: boolean }) => {
  const players = usePlayers();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${
          isPreGame ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {players.map((player) => (
          <PlayerCard
            key={player.ID}
            playerId={player.ID}
            isHost={player.isHost}
            isDrawing={player.isDrawing}
            name={player.username}
            color={player.color}
            isPreGame={isPreGame}
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
