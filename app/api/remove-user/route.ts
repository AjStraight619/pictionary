import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const { userId, gameId } = await req.json();
  console.log("Delete endpoint hit");
  const game = await db.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      players: true,
    },
  });

  if (!game) {
    return NextResponse.next();
  }

  const playerToRemove = game.players.find((p) => p.id === userId);

  return NextResponse.json({ message: `Hello from the Next API route: ` });
}
