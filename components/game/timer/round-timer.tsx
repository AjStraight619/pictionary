"use client";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { useTimer } from "@/hooks/useTimer";
import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";

type RoundTimerProps = {
  roomId: string;
};

export default function RoundTimer({ roomId }: RoundTimerProps) {
  const { time } = useTimer({
    messageType: "round_timer",
  });

  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (time === undefined || time > 5) return;
    const animation = () => {
      animate("#target", { scale: [1, 1.5, 1] }, { duration: 1 });
    };
    animation();
  }, [time, animate]);

  return (
    <div ref={scope}>
      <div id="target">{time}</div>
    </div>
  );
}
