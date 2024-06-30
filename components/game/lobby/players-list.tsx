"use client";

import { addAlphaToHex, getPlayerColor } from "@/lib/utils";
import { GamePlayer } from "@prisma/client";
import { motion } from "framer-motion";
import { CrownIcon, PencilIcon } from "lucide-react";
import { useEffect, useRef } from "react";

type PlayersListProps = {
  players: GamePlayer[];
  showScore?: boolean;
  currentDrawerId: string | null;
};

const containerVariants = {
  hidden: {
    opacity: 0,
    transition: {
      staggerChildren: 0.1,
      when: "afterChildren",
    },
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
    },
  },
};

const listVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// const mockPlayers: GamePlayer[] = [
//   {
//     id: "1",
//     username: "Player0",
//     score: 100,
//     isLeader: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     gameId: "game1",
//     playerId: "player1",
//   },
//   {
//     id: "2",
//     username: "Player1",
//     score: 80,
//     isLeader: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     gameId: "game1",
//     playerId: "player2",
//   },
//   {
//     id: "3",
//     username: "Player2",
//     score: 90,
//     isLeader: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     gameId: "game1",
//     playerId: "player3",
//   },
//   {
//     id: "4",
//     username: "Player3",
//     score: 70,
//     isLeader: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     gameId: "game1",
//     playerId: "player4",
//   },
//   {
//     id: "5",
//     username: "Player4",
//     score: 60,
//     isLeader: false,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     gameId: "game1",
//     playerId: "player5",
//   },
// ];

export default function PlayersList({
  players,
  showScore = true,
  currentDrawerId,
}: PlayersListProps) {
  const allPlayers = [...players];
  const renderRef = useRef(0);

  console.log("Current drawer id: ", currentDrawerId);

  useEffect(() => {
    console.log("player list component re rendered: ", renderRef.current++);
  });

  return (
    <>
      {allPlayers.length > 0 && (
        <motion.ul
          className="grid grid-cols-2 gap-2 p-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {allPlayers.map((p, idx) => {
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
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                    className="flex items-center justify-between flex-grow rounded-md p-2"
                  >
                    <div className="flex items-center gap-x-2">
                      <span className="font-semibold">{p.username}</span>
                      {currentDrawerId === p.id && <PencilIcon fill="orange" />}
                    </div>
                    {showScore && <span className="text-black">{p.score}</span>}
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
