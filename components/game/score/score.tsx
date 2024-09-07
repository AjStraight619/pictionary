'use client';
import React, { useEffect } from 'react';
import { useMotionValue, useTransform, animate, motion } from 'framer-motion';

type ScoreProps = {
  prevScore: number;
  gameId: string;
};

const Score = ({ prevScore }: ScoreProps) => {
  const count = useMotionValue(prevScore);
  const rounded = useTransform(count, latest => Math.round(latest));

  useEffect(() => {
    const animation = animate(count, prevScore, { duration: 3.5 });

    return () => animation.stop();
  }, [count, prevScore]);

  return <motion.div className="font-sans text-black">{rounded}</motion.div>;
};

export default Score;
