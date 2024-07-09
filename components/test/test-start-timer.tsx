"use client";
import { useTimer } from "@/hooks/useTimer";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";

export default function TestStartTimer() {
  //   const pathname = usePathname();
  //   const roomId = pathname.split("/").pop()!;

  const { startTimer } = useTimer({
    messageType: "test_timer",
  });

  const handleStartTimer = () => {
    startTimer({
      type: "countdown",
      data: {
        time: 80,
        timerType: "round_timer",
      },
    });
  };

  return <Button onClick={handleStartTimer}>Start</Button>;
}
