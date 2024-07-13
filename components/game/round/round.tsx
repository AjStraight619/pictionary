'use client';
import { useWord } from '@/context/word-provider';
import { motion, AnimatePresence } from 'framer-motion';
import WordDisplay from '../word/word-display';
import { GamePlayer } from '@prisma/client';
const containerVariants = {
  hidden: {
    y: -20,
    opacity: 0,
  },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

type RoundProps = {
  currentRound: number;
  maxRounds: number;
  players: GamePlayer[];
  currentDrawerId: string | null;
};
export default function Round({
  currentRound,
  maxRounds,
  players,
  currentDrawerId,
}: RoundProps) {
  return (
    <motion.div
      // variants={containerVariants}
      // animate="show"
      // initial="hidden"
      className="w-full bg-white flex items-center rounded-md gap-x-4 p-4"
    >
      <RoundInfo currentRound={currentRound} maxRounds={maxRounds} />
      <WordDisplay players={players} currentDrawerId={currentDrawerId} />
    </motion.div>
  );
}

function RoundInfo({
  currentRound,
  maxRounds,
}: {
  currentRound: number;
  maxRounds: number;
}) {
  return (
    <div className="flex items-center gap-x-2" role="status" aria-live="polite">
      <span className="text-lg">Round: </span>
      <span>{currentRound}</span>
      <span>/ </span>
      <span>{maxRounds}</span>
    </div>
  );
}

function RoundTimer() {}
