import { useEffect, useRef, useState } from "react";
import ChatInput from "./chat-input";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

type ChatMessage = {
  username: string;
  guess: string;
  color: string;
};

const Chat = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const { lastMessage } = useCustomWebsocket({ messageTypes: ["playerGuess"] });

  useEffect(() => {
    if (lastMessage) {
      const newChat = JSON.parse(lastMessage.data).payload;
      console.log("Received chat message:", newChat);
      setChats((chats) => [...chats, newChat]);
    }
  }, [lastMessage]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
            key={index}
            className="break-words bg-muted/30 rounded-lg p-2 text-sm"
          >
            <span className="font-semibold" style={{ color: chat.color }}>
              {chat.username}
            </span>
            <span className="text-muted-foreground">: {chat.guess}</span>
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
