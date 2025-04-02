import { motion } from "motion/react";

export default function Score({ score }: { score: number }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-xs text-muted-foreground truncate">{score}</div>
    </motion.div>
  );
}
