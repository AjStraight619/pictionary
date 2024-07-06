"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWord } from "@/context/word-provider";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { getRandomWords } from "@/lib/words";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import WordSelect from "./word-select";

type WordListProps = {
  newTurn: boolean;
  roundId: string;
  userId: string;
  roomId: string;
};

export default function WordList({
  newTurn,
  roundId,
  roomId,
  userId,
}: WordListProps) {
  const { pending } = useFormStatus();
  const renderRef = useRef(0);
  const [wordList, setWordList] = useState<string[]>([]);
  const [selectCountdown, setSelectCountdown] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    console.log("Word lists component re rendered: ", renderRef.current++);
  });

  useEffect(() => {
    console.log("words list Component mounted");
    setWordList(getRandomWords("Random", 3));
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const { updateWord } = useWord();

  const { sendJsonMessage, lastMessage } = useCustomWebSocket({
    roomId,
    userId,
    messageType: "select_word_countdown",
  });

  useEffect(() => {
    if (lastMessage) {
      const msg = JSON.parse(lastMessage.data);
      if (msg.data.time === 0 && inputRef.current) {
        inputRef.current.click();
      }
      setSelectCountdown(msg.data.time);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (newTurn) {
      sendJsonMessage({
        type: "countdown",
        data: {
          time: 30,
          timerType: "select_word_countdown",
        },
      });
    }
  }, [newTurn, sendJsonMessage]);

  const getNewWords = () => {
    setWordList(getRandomWords("Random", 3));
  };

  const handleSelectedWord = async (formData: FormData) => {
    formData.append("roundId", roundId);
    await updateWord(formData);
    sendJsonMessage({
      type: "stop_timer",
      data: {
        timerType: "select_word_countdown",
      },
    });
  };

  return (
    <Dialog open={newTurn}>
      <DialogContent>
        <div className="absolute top-2 right-2 flex items-center gap-x-2">
          <div>{selectCountdown}</div>
          <Button onClick={() => getNewWords()}>New Words</Button>
        </div>
        <DialogHeader>
          <DialogTitle className="text-2xl">Select A Word</DialogTitle>
          <DialogDescription className="font-roboto">
            It is your turn to draw, select a word!
          </DialogDescription>
        </DialogHeader>
        <form action={handleSelectedWord}>
          <ul className="flex flex-row items-center justify-evenly text-lg">
            {wordList.map((word, idx) => (
              <li key={idx}>
                <WordSelect pending={pending} inputRef={inputRef} word={word} />
              </li>
            ))}
          </ul>
        </form>
      </DialogContent>
    </Dialog>
  );
}
