import { GamePlayer } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCustomWebSocket } from './useCustomWebsocket';
import { useRoom } from './useRoom';

type UsePlayers = {
  players: GamePlayer[];
};

export const usePlayers = ({ players }: UsePlayers) => {
  const { roomId } = useRoom();
  const { lastMessage } = useCustomWebSocket({
    roomId: roomId,
    messageType: 'player_joined',
  });
};
