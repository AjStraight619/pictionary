import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameStatus, usePlayers } from "@/hooks/useGameSelector";
import PlayerCard from "./player-card";
import { GameStatus } from "@/types/game";

export default function PostGameLobby() {
  const players = usePlayers();
  const playerOrderByScore = players.slice().sort((a, b) => b.score - a.score);
  const gameStatus = useGameStatus();
  const open = gameStatus === GameStatus.Finished;

  return (
    <Dialog open={open}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton={true}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle>Game Over</DialogTitle>
        <div className="grid grid-cols-1 grid-rows-8 gap-2 grid-flow-col">
          {playerOrderByScore.map((player, idx) => (
            <div className="flex flex-row gap-x-2">
              <div>{idx + 1}</div>
              <PlayerCard
                key={player.ID}
                isHost={player.isHost}
                isDrawing={player.isDrawing}
                name={player.username}
                score={player.score}
                color={player.color}
              />
            </div>
          ))}
        </div>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
