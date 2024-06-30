"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "./chat-input";
import { GamePlayer } from "@prisma/client";
import { motion } from "framer-motion";
import { ChatMessage } from "@/types/ws";
import React from "react";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";

type ChatProps = {
  players: GamePlayer[];
  userId: string;
  roomId: string;
};

const listVariants = {
  initial: {
    x: -20,
  },
  animate: {
    x: 0,
    transition: {
      duration: 0.5,
      type: "spring",
    },
  },
};

const Chat = ({ players, userId, roomId }: ChatProps) => {
  const { lastMessage } = useCustomWebSocket({
    roomId,
    userId,
    messageType: "chat",
  });
  const [chats, setChats] = useState<ChatMessage[]>([]);

  const renderRef = useRef(0);
  useEffect(() => {
    console.log("Chat component re rendered: ", renderRef.current++);
  });

  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data);
      if (parsedMessage.type === "chat") {
        console.log("last message: ", parsedMessage.data);
        const message: ChatMessage = parsedMessage.data;
        setChats((prevChats) => [...prevChats, message]);
      }
    }
  }, [lastMessage]);

  const bottomOfMessagesRef = useRef<HTMLDivElement | null>(null);

  const player = useMemo(
    () => players.find((p) => p.playerId === userId),
    [players, userId]
  );

  useEffect(() => {
    if (bottomOfMessagesRef.current) {
      bottomOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chats]);

  return (
    <Card className="h-full w-1/3 flex flex-col">
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow overflow-y-auto">
        <ul className="flex-grow">
          {chats.map((chat, idx) => (
            <motion.li
              variants={listVariants}
              animate="animate"
              initial="initial"
              key={idx}
            >
              <span className="font-bangers">{chat.username}</span>
              <span className="font-roboto">: </span>
              <span className="font-roboto">{chat.message}</span>
            </motion.li>
          ))}
        </ul>
        <div ref={bottomOfMessagesRef} />
      </CardContent>
      <CardFooter className="mt-auto w-full">
        <ChatInput roomId={roomId} userId={userId} player={player} />
      </CardFooter>
    </Card>
  );
};

export default React.memo(Chat);
