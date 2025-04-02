import type React from "react";
import { motion } from "framer-motion";

type DoodleElementProps = {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export function DoodleElement({
  className,
  style,
  children,
}: DoodleElementProps) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      style={style}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.8,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
