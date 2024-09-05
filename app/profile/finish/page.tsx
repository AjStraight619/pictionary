import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import FinishProfileForm from './_finish-profile-form';
import { db } from '@/lib/db';

const getPlayer = async (id: string) => {
  const player = await db.player.findUnique({
    where: {
      id,
    },
  });
  return player;
};

export default async function ProfileFinishPage() {
  const user = await currentUser();
  if (!user || !user.id) redirect('/sign-in');
  const player = await getPlayer(user.id);
  if (player) redirect('/');
  return <FinishProfileForm email={user.primaryEmailAddress?.emailAddress} />;
}
