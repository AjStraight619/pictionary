import { GamePlayer } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

type UsePlayers = {
  players: GamePlayer[];
};

export const usePlayers = ({ players }: UsePlayers) => {
  const removePlayerFromPlayersList = useMutation({});

  useEffect(() => {}, []);
};

async function removePlayer() {}
