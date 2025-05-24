import { useEffect, useRef } from "react";
import ChatInput from "./chat-input";
import { useChatMessages } from "@/hooks/useGameSelector";
import { PlayerScoreChange } from "../player/player-score-change";
const Chat = () => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chats = useChatMessages();
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Scroll the container to the bottom
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [chats]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {chats.map((chat, index) => (
          <div
            key={`${chat.playerID}-${index}`}
            className="break-words bg-muted/30 rounded-lg p-2 text-sm"
          >
            <span className="font-semibold text-purple-400">
              {chat.username}
            </span>
            <span className="text-muted-foreground">: {chat.guess}</span>
            {chat.isCorrect && <PlayerScoreChange playerId={chat.playerID} />}
          </div>
        ))}
        {chats.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            No messages yet. Start guessing!
          </div>
        )}
      </div>
      <div className="p-3 border-t">
        <ChatInput />
      </div>
    </div>
  );
};

export default Chat;
