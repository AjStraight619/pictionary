import { usePlayer } from "@/hooks/useGameSelector";
import { motion } from "motion/react";

export default function Score({ playerId }: { playerId: string }) {
  const player = usePlayer(playerId);
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-xs text-muted-foreground truncate">
        {player?.score}
      </div>
    </motion.div>
  );
}
