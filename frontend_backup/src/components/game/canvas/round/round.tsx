import { useCurrentRound, useGameOptions } from "@/hooks/useGameSelector";
import { Clock } from "lucide-react";

const Round = () => {
  const currentRound = useCurrentRound();
  const gameOptions = useGameOptions();

  return (
    <div className="hidden md:flex items-center gap-2 ml-auto">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">
        {currentRound && currentRound.count / gameOptions.roundLimit}
      </span>
    </div>
  );
};

export default Round;
