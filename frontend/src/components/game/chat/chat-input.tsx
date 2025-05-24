import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useReadLocalStorage } from "usehooks-ts";
import type { PlayerInfo } from "@/types/lobby";
import { useCurrentDrawerFromPlayers } from "@/hooks/useGameSelector";
import { Send } from "lucide-react";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

const ChatInput = () => {
  const [input, setInput] = useState("");
  const playerInfo = useReadLocalStorage<PlayerInfo | null>("playerInfo");
  const drawingPlayerID = useCurrentDrawerFromPlayers();

  const { sendJsonMessage } = useCustomWebsocket({});

  const isDrawingPlayer = playerInfo?.playerID === drawingPlayerID;

  const handleSendMessage = () => {
    if (!input.trim()) return;

    sendJsonMessage({
      type: "playerGuess",
      payload: {
        playerID: playerInfo?.playerID,
        username: playerInfo?.username,
        guess: input,
      },
    });
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        disabled={isDrawingPlayer}
        placeholder={isDrawingPlayer ? "You are drawing..." : "Guess the word!"}
        onKeyDown={onKeyDown}
        onChange={(e) => setInput(e.target.value)}
        value={input}
        className="flex-1"
      />
      <Button
        size="icon"
        disabled={isDrawingPlayer || !input.trim()}
        onClick={handleSendMessage}
        className="bg-primary"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ChatInput;
