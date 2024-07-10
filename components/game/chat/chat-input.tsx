import { Input } from '@/components/ui/input';
import { useWord } from '@/context/word-provider';
import { useCustomWebSocket } from '@/hooks/useCustomWebsocket';
import useLocalStorage from '@/hooks/useLocalStorage';
import { ChatMessage } from '@/types/ws';
import { GamePlayer } from '@prisma/client';
import { useState } from 'react';

type ChatInputProps = {
  player: GamePlayer | undefined;
  roomId: string;
  userId: string;
};

type Guess = {
  userId: string;
  isCorrect: boolean;
};

export default function ChatInput({ player, roomId, userId }: ChatInputProps) {
  const [input, setInput] = useState('');
  const { sendJsonMessage } = useCustomWebSocket({ roomId, userId });
  const [isGuessCorrect, setIsGuessCorrect] = useLocalStorage<Guess | null>(
    'isGuessCorrect',
    null,
  );

  const { word } = useWord();

  const isCorrect = (guess: string) => {
    return word.toLowerCase() === guess.toLowerCase();
  };

  const isClose = (guess: string) => {
    if (word.toLowerCase() === guess.toLowerCase()) return false;

    return true;
  };

  const sendMessage = async (formData: FormData) => {
    if (!player) {
      return;
    }

    if (!input.trim()) return;

    const newChat: ChatMessage = {
      id: player.id,
      username: player.username,
      message: input,
      isCorrect: isCorrect(input.trim()),
      isClose: isClose(input.trim()),
    };
    sendJsonMessage({ type: 'chat', data: newChat });
    if (newChat.isCorrect) {
      setIsGuessCorrect({
        userId: userId,
        isCorrect: true,
      });
    }
    setInput('');
  };

  return (
    <form action={sendMessage} className="relative w-full">
      <Input
        disabled={isGuessCorrect?.isCorrect}
        className="font-roboto"
        name="guess"
        placeholder="Guess the word..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
    </form>
  );
}
