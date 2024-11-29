import { Button } from '@/components/ui/button';
import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';
import { fetchWord } from '@/utils/fetch';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';

const WordFetcher = ({ gameId }: { gameId?: string }) => {
  const { id } = useParams();
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  // React Query `useQuery` for fetching the word

  const ref = useRef(0);
  useEffect(() => {
    ref.current++;
    console.log('WordFetcher component re-rendered: ', ref.current);
  });
  const {
    // isLoading,
    // isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['word', gameId],
    queryFn: () => fetchWord(id as string),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const { lastMessage } = useCustomWebsocket({
    gameId: id as string,
    messageTypes: ['new-word', 'game-state'],
  });

  useEffect(() => {
    if (lastMessage) {
      const parsedMessage = JSON.parse(lastMessage.data);
      console.log('Handling WebSocket message:', parsedMessage);
      if (parsedMessage.type === 'new-word') {
        setCurrentWord(parsedMessage.payload.currentWord);
      } else if (parsedMessage.type === 'game-state') {
        // Sync the word from the game state on refresh
        setCurrentWord(parsedMessage.payload.currentWord);
      }
    }
  }, [lastMessage]);

  //   if (isLoading) return <p>Loading...</p>;
  //   if (isError) return <p>Error fetching word</p>;

  return (
    <div className="flex flex-row items-center">
      {error && <p>{error.message}</p>}
      <p>Word: {currentWord}</p>
      <Button onClick={() => refetch()}>Fetch New Word</Button>
    </div>
  );
};

export default WordFetcher;
