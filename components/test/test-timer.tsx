"use client";

import { useTimer } from "@/hooks/useTimer";

export default function TestTimer() {
  const { time } = useTimer({
    messageType: "test_timer",
    onShouldTimerStop: (time) => time === 0,
    onTimerStop: () => {
      console.log("Timer stopped...");
    },
  });

  return <div>{time}</div>;
}
