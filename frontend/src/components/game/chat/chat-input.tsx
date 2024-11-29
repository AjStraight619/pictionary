import React, { useState } from 'react';
import { SendJsonMessage } from 'react-use-websocket/dist/lib/types';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from 'usehooks-ts';
import { PlayerInfo } from '@/types/lobby';

type ChatInputProps = {
  sendJsonMessage: SendJsonMessage;
};

const ChatInput = ({ sendJsonMessage }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [playerInfo] = useLocalStorage<PlayerInfo | null>('playerInfo', null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendJsonMessage({
        type: 'chat',
        payload: { username: playerInfo?.name, message: input },
      });
      setInput('');
    }
  };

  return (
    <Input
      placeholder="Guess the word!"
      onKeyDown={onKeyDown}
      onChange={e => setInput(e.target.value)}
      value={input}
    />
  );
};

export default ChatInput;
