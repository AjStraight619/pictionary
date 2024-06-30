import CreateRoom from "@/components/landing-page/create-room";
import FindGame from "@/components/landing-page/find-game";
import RoomActionWrapper from "@/components/landing-page/room-action-wrapper";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const player = await db.player.findUnique({
    where: {
      id: user.id,
    },
  });

  if (!player) {
    redirect("/profile/finish");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <RoomActionWrapper>
        <CreateRoom />
        <FindGame />
      </RoomActionWrapper>
    </main>
  );
}
