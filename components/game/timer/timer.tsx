import { useState } from "react";

type TimerProps = {
  time: number | undefined;
};

export default function Timer({ time }: TimerProps) {
  const [timer, setTimer] = useState<number | undefined>(time);

  return <div>{time}</div>;
}
