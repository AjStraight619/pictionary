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

export default function MyGameList({ myGames }: MyGamesListProps) {
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
