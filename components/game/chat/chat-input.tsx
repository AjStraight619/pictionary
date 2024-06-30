import { Input } from "@/components/ui/input";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { ChatMessage } from "@/types/ws";
import { GamePlayer, Player } from "@prisma/client";
import { useState } from "react";

type ChatInputProps = {
  player: GamePlayer | undefined;
  roomId: string;
  userId: string;
};

export default function ChatInput({ player, roomId, userId }: ChatInputProps) {
  const [input, setInput] = useState("");
  const { sendJsonMessage } = useCustomWebSocket({ roomId, userId });

  const sendMessage = async (formData: FormData) => {
    if (!player) {
      return;
    }
    const newChat: ChatMessage = {
      id: player.id,
      username: player.username,
      message: input,
      isCorrect: true,
      isClose: false,
    };
    sendJsonMessage({ type: "chat", data: newChat });
    setInput("");
    // // formData.append("currentTime", String(timer));
    // formData.append("playerId", player.id);
    // formData.append("currentWord", "TEST WORD");
    // await checkGuess(formData);
  };

  return (
    <form action={sendMessage} className="relative w-full">
      <Input
        className="font-roboto"
        name="guess"
        placeholder="Guess the word..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      {/* <Button className="absolute top-1/2 right-1/2" size="icon" type="submit">
        
      </Button> */}
    </form>
  );
}
