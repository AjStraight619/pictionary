import { updateScore } from '@/actions/score';
import { Input } from '@/components/ui/input';
import { useWord } from '@/context/word-provider';
import { useCustomWebSocket } from '@/hooks/useCustomWebsocket';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useTimer } from '@/hooks/useTimer';
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
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);
  const { sendJsonMessage } = useCustomWebSocket({
    roomId,
    userId,
    messageType: 'chat',
  });

  const { time } = useTimer({ messageType: 'round_timer' });
  // TODO: Need to change this to use database to track when a user guesses correct to disable the chat input, so someone can't run localStorage.clear() in browser and boost their score.
  const [isGuessCorrect, setIsGuessCorrect] = useLocalStorage<Guess | null>(
    'guesses',
    null,
  );

  const { word } = useWord();

  const isCorrect = (guess: string) => {
    return word.toLowerCase() === guess.toLowerCase();
  };

  const isClose = (guess: string) => {
    // Normalize the case
    const wordLower = word.toLowerCase();
    const guessLower = guess.toLowerCase();

    // If it's an exact match, return false (not close)
    if (wordLower === guessLower) return false;

    const wordLength = wordLower.length;

    // Set the threshold based on word length
    const allowedDifference = wordLength > 6 ? 2 : 1;

    // Check character-by-character differences
    let differenceCount = 0;

    for (let i = 0; i < Math.min(wordLower.length, guessLower.length); i++) {
      if (wordLower[i] !== guessLower[i]) {
        differenceCount++;
      }
    }

    // Account for any extra characters in longer word
    differenceCount += Math.abs(wordLower.length - guessLower.length);

    // If the difference is within the allowed range, return true (it's close)
    return differenceCount <= allowedDifference;
  };

  const sendMessage = async (formData: FormData) => {
    if (!player) {
      return;
    }

    if (!input.trim()) return;

    const trimmedInput = input.trim();

    const newChat: ChatMessage = {
      id: player.id,
      username: player.username,
      message: trimmedInput,
      isCorrect: isCorrect(trimmedInput),
      isClose: isClose(trimmedInput),
    };

    if (!newChat.isCorrect || newChat.isClose) {
      sendJsonMessage({ type: 'chat', data: newChat });
      setInput('');
      return;
    }

    // If the guess is correct, update the message and the score
    newChat.message = `${player.username} guessed correctly!!`;
    sendJsonMessage({ type: 'chat', data: newChat });

    const points = calculateScore();
    await updateScore(points, roomId);
    setInput('');
  };

  const calculateScore = () => {
    let points = 0;
    if (!time) return points;
    if (time > 60) {
      points = 100;
    } else if (time > 40) {
      points = 80;
    } else if (time > 20) {
      points = 60;
    } else if (time > 1) {
      points = 40;
    } else {
      return points;
    }
    return points;
  };

  return (
    <form action={sendMessage} className="relative w-full">
      <Input
        autoComplete="off"
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
