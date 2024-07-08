"use client";
import { useWord } from "@/context/word-provider";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useSession } from "@clerk/nextjs";
import { GamePlayer } from "@prisma/client";
import { useCallback, useEffect, useState } from "react";

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
  const currentDrawingUser = players.find(
    (p) => p.playerId === currentDrawerId
  );
  const splitWord = word?.split("");
  const isCurrentDrawingUser = currentDrawingUser?.playerId === userId;
  const [revealedLetters, setRevealedLetters] = useLocalStorage<boolean[]>(
    `revealedLetters-${roomId}`,
    Array(splitWord.length).fill(false)
  );
  const revealInterval = 80000 / splitWord.length;

  const { lastMessage } = useCustomWebSocket({
    roomId,
    userId,
    messageType: "countdown",
  });

  const revealLetter = useCallback(() => {
    setRevealedLetters((prevRevealedLetters) => {
      const unrevealedIndices = prevRevealedLetters
        .map((revealed, idx) => (!revealed ? idx : null))
        .filter((idx) => idx !== null);

      if (unrevealedIndices.length > 0) {
        const randomIdx =
          unrevealedIndices[
            Math.floor(Math.random() * unrevealedIndices.length)
          ];
        const newRevealedLetters = [...prevRevealedLetters];
        newRevealedLetters[randomIdx ?? 0] = true;
        return newRevealedLetters;
      }

      return prevRevealedLetters;
    });
  }, [setRevealedLetters]);

  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      const currentTime = message.data.time;
      if (currentTime > 0 && currentTime % revealInterval === 0) {
        revealLetter();
      }
    }
  }, [lastMessage, revealLetter, revealInterval]);

  const renderWordForDrawer = () => {
    return (
      <>
        {splitWord?.map((ch, idx) => (
          <div
            className="text-3xl flex flex-col items-center justify-center -space-y-5"
            key={idx}
          >
            <span>{ch !== " " ? ch : "   "}</span>
            <span>
              {ch !== " " ? <span className="tracking-tighter">__</span> : " "}
            </span>
          </div>
        ))}
      </>
    );
  };

  const renderWordForGuesser = () => {
    return (
      <>
        {splitWord?.map((ch, idx) => (
          <div
            className="text-3xl flex flex-col items-center justify-center -space-y-5"
            key={idx}
          >
            <span>{revealedLetters[idx] ? ch : " "}</span>
            <span>
              {ch !== " " ? <span className="tracking-tighter">__</span> : " "}
            </span>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="bg-white rounded-md p-2 flex items-center gap-x-2">
      <>
        {" "}
        {isCurrentDrawingUser ? (
          <>
            <span className="text-2xl mr-4">Draw This:</span>
            {renderWordForDrawer()}
          </>
        ) : (
          <>
            <span>Guess This:</span>
          </>
        )}
      </>
      {/* {splitWord?.map((ch, idx) => (
        <div
          className="text-3xl flex flex-col items-center justify-center -space-y-5"
          key={idx}
        >
          <span>{ch !== " " ? ch : "   "}</span>
          <span>
            {ch !== " " ? <span className="tracking-tighter">__</span> : " "}
          </span>
        </div>
      ))} */}
      <div className="self-end ml-2">{splitWord?.length}</div>
    </div>
  );
}
