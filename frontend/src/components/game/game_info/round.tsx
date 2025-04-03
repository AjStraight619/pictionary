import { useCurrentRound, useGameStatus } from "@/hooks/useGameSelector";
import { GameStatus } from "@/types/game";

const Round = () => {
  const round = useCurrentRound();
  const gameStatus = useGameStatus();

  if (gameStatus === GameStatus.NotStarted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
      <span className="text-xs font-medium">Round {round?.count}</span>
    </div>
  );
};

export default Round;
