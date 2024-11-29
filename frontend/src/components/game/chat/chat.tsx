import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ChatInput from './chat-input';

type ChatMessage = {
  username: string;
  message: string;
};

const Chat = () => {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const { lastMessage, sendJsonMessage } = useCustomWebsocket({
    messageTypes: ['chat'],
    queryParams: {},
  });

  useEffect(() => {
    if (lastMessage) {
      const newChat = JSON.parse(lastMessage.data).payload;
      setChats(chats => [...chats, newChat]);
    }
  }, [lastMessage]);

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="h-[10rem] overflow-y-auto">
        {chats.map((chat, index) => (
          <div key={index}>
            <p>
              {chat.username}: {chat.message}
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
