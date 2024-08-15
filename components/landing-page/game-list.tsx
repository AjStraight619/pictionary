'use client';

import { motion } from 'framer-motion';
import { UsersRoundIcon } from 'lucide-react';
import SubmitButton2 from '../ui/submit-button2';
import { Separator } from '../ui/separator';
import { joinGame } from '@/actions/game';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorMessage, SuccessMessage } from '../forms/form-messages';

type GameListProps = {
  openGames: {
    id: string;
    name: string;
    playerCount: number;
  }[];
};

const containerVariant = {
  hidden: {
    opacity: 1,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const childVariant = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export default function GameList({ openGames }: GameListProps) {
  const [error, setError] = useState('');
  const { push } = useRouter();

  const handleJoinGame = async (formData: FormData) => {
    const gameId = formData.get('gameId');
    const { success, error } = await joinGame(gameId as string);
    if (success) {
      push(`/room/${gameId}`);
    } else {
      setError(error ? error : '');
    }
  };

  console.log('Open games: ', openGames);
  return (
    <>
      <h3 className="font-semibold text-xl">Open Games:</h3>
      <hr />
      {error && <ErrorMessage message={error} />}
      <motion.ul
        className="flex flex-col gap-y-2 mt-4 overflow-y-auto"
        variants={containerVariant}
        initial="hidden"
        animate="visible"
      >
        {openGames.map(game => (
          <React.Fragment key={game.id}>
            <motion.li
              className="flex flex-row items-center justify-between gap-x-2"
              variants={childVariant}
            >
              <div className="flex items-center gap-x-2">
                <span className="font-semibold">Room:</span>
                <span className="font-bold capitalize">{game.name}</span>
              </div>
              <div className="flex items-center gap-x-2">
                <span>{game.playerCount} / 8</span>
                <UsersRoundIcon size={15} />
                <form action={handleJoinGame}>
                  <input name="gameId" hidden defaultValue={game.id} />
                  <SubmitButton2>Join</SubmitButton2>
                </form>
              </div>
            </motion.li>
            <Separator className="mt-1" />
          </React.Fragment>
        ))}
      </motion.ul>
    </>
  );
}
