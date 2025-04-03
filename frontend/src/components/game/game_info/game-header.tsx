import { motion } from "motion/react";

const containerVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const GameHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex items-center justify-center h-16 bg-card rounded-lg border shadow-sm px-4 gap-4"
    >
      {children}
    </motion.div>
  );
};

export default GameHeader;
