import { Game, GamePlayer } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useCustomWebSocket } from './useCustomWebsocket';
import { useRoom } from './useRoom';

type UsePlayers = {
  players: GamePlayer[];
};

export const usePlayers = ({ players }: UsePlayers) => {
  const [gamePlayers, setGamePlayers] = useState<Map<string, GamePlayer>>();

  const { roomId } = useRoom();
  const { lastMessage } = useCustomWebSocket({
    roomId: roomId,
    messageType: 'player_joined',
  });
};
