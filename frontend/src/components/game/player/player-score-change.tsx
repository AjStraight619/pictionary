import { motion } from "motion/react";
import { usePlayer } from "@/hooks/useGameSelector";

export function PlayerScoreChange({
  playerId,
  onAnimationComplete,
}: {
  playerId: string;
  onAnimationComplete?: () => void;
}) {
  const player = usePlayer(playerId);
  const pointsChange = player?.pointsChange;

  if (!pointsChange) return null;

  // Randomize the angle (in radians) between 0 and π
  const angle = Math.random() * Math.PI;
  const distance = 40; // px to float
  const x = Math.cos(angle) * distance;
  const y = -Math.abs(Math.sin(angle) * distance); // always float up

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0 }}
      animate={{ opacity: 0, x, y }}
      transition={{ duration: 1, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        transform: "translateX(-50%)",
        color: "green",
        fontWeight: "bold",
        pointerEvents: "none",
        zIndex: 10,
      }}
      onAnimationComplete={onAnimationComplete}
    >
      +{pointsChange}
    </motion.div>
  );
}
