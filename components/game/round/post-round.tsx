'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GamePlayer } from '@prisma/client';
import React, { useState } from 'react';

type PostRoundProps = {
  players: GamePlayer[];
  newTurn: boolean;
  currentDrawerId: string | null;
  gameId?: string;
};

const PostRound = ({
  players,
  newTurn,
  currentDrawerId,
  gameId,
}: PostRoundProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Round Results</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default PostRound;
