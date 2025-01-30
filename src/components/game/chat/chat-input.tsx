import React, { useState } from "react";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";
import { Input } from "@/components/ui/input";
import { useReadLocalStorage } from "usehooks-ts";
import { PlayerInfo } from "@/types/lobby";
import { useGame } from "@/providers/game-provider";

type ChatInputProps = {
  sendJsonMessage: SendJsonMessage;
};

const ChatInput = ({ sendJsonMessage }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");

  const { isDrawingPlayer } = useGame();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!input.trim()) return;
    if (e.key === "Enter") {
      sendJsonMessage({
        type: "playerGuess",
        payload: {
          playerId: playerInfo?.playerId,
          username: playerInfo?.name,
          guess: input,
        },
      });
      setInput("");
    }
  };

  return (
    <Input
      disabled={isDrawingPlayer}
      placeholder="Guess the word!"
      onKeyDown={onKeyDown}
      onChange={(e) => setInput(e.target.value)}
      value={input}
    />
  );
};

export default ChatInput;
