"use client";
import { GamePlayer } from "@prisma/client";

type WordDisplayProps = {
  userId: string;
  roomId: string;
  currentDrawerId: string | null;
  players: GamePlayer[];
};

export default function WordDisplay() {}
