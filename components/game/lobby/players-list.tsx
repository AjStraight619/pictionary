'use client';

import { addAlphaToHex, getPlayerColor } from '@/lib/utils';
import { GamePlayer } from '@prisma/client';
import { motion } from 'framer-motion';
import { CrownIcon, PencilIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import Score from '../score/score';

type PlayersListProps = {
  players: GamePlayer[];
  showScore?: boolean;
  currentDrawerId: string | null;
  roomId: string;
};

const containerVariants = {
  hidden: {
    opacity: 0,
    transition: {
      staggerChildren: 0.1,
      when: 'afterChildren',
    },
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: 'beforeChildren',
    },
  },
};

const listVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function PlayersList({
  players,
  showScore = true,
  currentDrawerId,
  roomId,
}: PlayersListProps) {
  return (
    <>
      {players.length > 0 && (
        <motion.ul
          className="grid grid-cols-2 gap-2 p-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {players.map((p, idx) => {
            const playerColor = getPlayerColor(idx);
            const backgroundColor = addAlphaToHex(playerColor, 0.3);
            return (
              <motion.li
                className="flex items-center gap-x-2"
                key={p.id}
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="flex items-center gap-x-1 w-full">
                  <div className="flex-shrink-0 w-6">
                    {p.isLeader && <CrownIcon fill="gold" />}
                  </div>
                  <div
                    style={{
                      backgroundColor,
                      color: playerColor,
                      borderColor: playerColor,
                      borderWidth: '1px',
                      borderStyle: 'solid',
                    }}
                    className="flex items-center justify-between flex-grow rounded-md p-2"
                  >
                    <div className="flex items-center gap-x-2">
                      <span className="font-semibold">{p.username}</span>
                      {currentDrawerId === p.id && <PencilIcon fill="orange" />}
                    </div>
                    {showScore && <Score gameId={roomId} prevScore={p.score} />}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </>
  );
}
