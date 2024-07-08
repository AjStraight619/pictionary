"use client";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { useTimer } from "@/hooks/useTimer";
import { motion, useAnimate } from "framer-motion";
import { useEffect } from "react";

type RoundTimerProps = {
  roomId: string;
};

export default function RoundTimer({ roomId }: RoundTimerProps) {
  const { lastMessage } = useCustomWebSocket({
    roomId,
    messageType: "round_timer",
  });

  const { time } = useTimer({
    lastMessage,
    timerType: "round_timer",
    onShouldStopTimer: (time) => time === 0,
  });

  const [scope, animate] = useAnimate();

  useEffect(() => {
    const animation = () => {
      animate("#target", { scale: [1, 1.5, 1] }, { duration: 1 });
    };
    if (time) {
      if (time > 5) return;
      animation();
    }
  }, [time, animate]);

  return (
    <div ref={scope}>
      <div id="target">{time}</div>
    </div>
  );
}
