"use client";
import React, { useEffect, memo, useState } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";

type ScoreProps = {
  prevScore: number;
  gameId: string;
};

const Score = ({ prevScore, gameId }: ScoreProps) => {
  const count = useMotionValue(prevScore);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  const { lastMessage } = useCustomWebSocket({
    roomId: gameId,
    messageType: "score",
  });

  useEffect(() => {
    if (lastMessage) {
      const parsedMsg = JSON.parse(lastMessage.data);
      const calculatedScore = parsedMsg.data.score as number;
      if (calculatedScore === prevScore) return;
      console.log("CalculatedScore: ", calculatedScore);
      const animation = animate(count, calculatedScore, { duration: 3 });

      return () => animation.stop();
    }
  }, [count, lastMessage, prevScore]);

  return <motion.div>{rounded}</motion.div>;
};

export default memo(Score);
