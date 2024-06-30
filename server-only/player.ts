import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import "server-only";

export async function getPlayer() {
  const user = await currentUser();
  if (!user || !user.id) redirect("/sign-in");

  const player = await db.player.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!player) redirect("/profile/finish");
  return player;
}
