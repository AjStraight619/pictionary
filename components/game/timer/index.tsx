"use client";

import { Button } from "@/components/ui/button";

// import { useWebSocket } from "@/context/websocket-context";
import { useRef } from "react";

export default function Timer() {
  // const { wsRef, timers } = useWebSocket();

  const counterRef = useRef(0);

  // const startTimer = () => {
  //   const timerType = "round_timer";
  //   const initialTime = 80;

  //   if (wsRef.current) {
  //     wsRef.current.send(
  //       JSON.stringify({
  //         type: "countdown",
  //         data: {
  //           time: initialTime,
  //           timerType: timerType,
  //         },
  //       })
  //     );
  //   }
  // };

  // const stopTimer = () => {
  //   const timerType = "round_timer";

  //   if (wsRef.current) {
  //     wsRef.current.send(
  //       JSON.stringify({
  //         type: "stop_timer",
  //         data: {
  //           timerType: timerType,
  //         },
  //       })
  //     );
  //   }
  // };

  return (
    <>
      {/* <Button onClick={startTimer}>Start Timer</Button> */}
      {/* <Button onClick={stopTimer}>Stop Timer</Button> */}
      {/* <span className="ml-2">{timer ? timer.time : "No Timer"}</span> */}
    </>
  );
}
