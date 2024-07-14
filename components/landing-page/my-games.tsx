import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export default async function MyGames() {
  const user = await currentUser();
  if (!user || !user.id) return;
  const userId = user.id;
  const myGames = await getMyGames(userId);

  return <MyGameList myGames={myGames} />;
}

import { Prisma } from '@prisma/client';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { getMyGames } from '@/server-only/game';
import Link from 'next/link';

type MyGamesListProps = {
  myGames: Prisma.PromiseReturnType<typeof getMyGames>;
};

function MyGameList({ myGames }: MyGamesListProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Games</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My Games</DropdownMenuLabel>
        {myGames.map(game => (
          <DropdownMenuItem key={game.id}>
            <Link href={`/room/${game.id}`}>{game.name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
