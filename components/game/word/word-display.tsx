"use client";
import { useWord } from "@/context/word-provider";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { useSession } from "@clerk/nextjs";
import { GamePlayer } from "@prisma/client";
import { useEffect } from "react";

type WordDisplayProps = {
  userId: string;
  roomId: string;
  currentDrawerId: string | null;
  players: GamePlayer[];
};

export default function WordDisplay({
  userId,
  roomId,
  currentDrawerId,
  players,
}: WordDisplayProps) {
  const { word } = useWord();
  const currentDrawingUser = players.find((p) => p.id === currentDrawerId);
  const splitWord = word?.split("");
  const { session } = useSession();
  const isCurrentDrawingUser = currentDrawingUser?.id === userId;

  const { lastMessage } = useCustomWebSocket({
    roomId,
    userId,
    messageType: "countdown",
  });

  // TODO: Depending on the timer and length of word start showing characters of the word at certain intervals
  useEffect(() => {
    if (lastMessage) {
    }
  }, [lastMessage]);

  const renderWordForGuesser = () => {};

  return (
    <div className="bg-white rounded-md p-2 flex items-center gap-x-2">
      <p className="text-2xl mr-4">
        {" "}
        {isCurrentDrawingUser ? (
          <span>Draw This:</span>
        ) : (
          <span>Guess This:</span>
        )}
      </p>
      {splitWord?.map((ch, idx) => (
        <div
          className="text-3xl flex flex-col items-center justify-center -space-y-5"
          key={idx}
        >
          <span>{ch !== " " ? ch : " "}</span>
          <span>{ch !== " " ? <span>__</span> : " "}</span>
        </div>
      ))}
      <div className="self-end ml-2">{splitWord?.length}</div>
    </div>
  );
}
