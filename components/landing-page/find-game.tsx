import { db } from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { redirect } from "next/navigation";
import { Button } from "../ui/button";
import GameList from "./game-list";

const getOpenGames = async () => {
  const openGames = await db.game.findMany({
    where: {
      isOpen: true,
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          players: true,
        },
      },
    },
    take: 10,
  });
  return openGames.map((game) => ({
    id: game.id,
    name: game.name,
    playerCount: game._count.players,
  }));
};

export default async function FindGame() {
  // TODO: Implement this later

  const openGames = await getOpenGames();

  const joinInviteLink = async (formData: FormData) => {
    "use server";
    const inviteLink = formData.get("inviteLink");
    redirect(`/room/${inviteLink}`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">Join Room</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a game</DialogTitle>
          <DialogDescription>
            Join an invite link or an open room
          </DialogDescription>
        </DialogHeader>
        <form className="flex items-center gap-x-2" action={joinInviteLink}>
          <Input name="inviteLink" placeholder="Invite Link" />
          <Button type="submit">Join</Button>
        </form>
        <GameList openGames={openGames} />
      </DialogContent>
    </Dialog>
  );
}
