import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ChatInput from "./chat-input";

type ChatMessage = {
  username: string;
  guess: string;
};

const Chat = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);

  const { lastMessage, sendJsonMessage } = useCustomWebsocket({
    messageTypes: ["playerGuess"],
  });

  const cardContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessage) {
      const newChat = JSON.parse(lastMessage.data).payload;
      setChats((chats) => [...chats, newChat]);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (cardContentRef.current) {
      // Scroll the container to the bottom
      cardContentRef.current.scrollTop = cardContentRef.current.scrollHeight;
    }
  }, [chats]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent
        ref={cardContentRef}
        className="min-h-[10rem] max-h-[10rem] overflow-y-auto"
      >
        {chats.map((chat, index) => (
          <div key={index} className="break-words">
            <p>
              <strong>{chat.username}</strong>: {chat.guess}
            </p>
          </div>
        ))}
      </CardContent>

      <CardFooter>
        <ChatInput sendJsonMessage={sendJsonMessage} />
      </CardFooter>
    </Card>
  );
};

export default Chat;
