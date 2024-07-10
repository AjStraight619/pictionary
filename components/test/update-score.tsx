'use client';

import { updateScore } from '@/actions/score';
import { useMutation } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';

export default function UpdateScoreTest() {
  const pathname = usePathname();
  const gameId = pathname.split('/').pop()!;

  //   const scoreUpdate = useMutation({
  //     mutationFn: () => updateScore(60, gameId),
  //     // mutationKey: [`${userId}-score`],
  //   });

  async function scoreUpdate() {
    await updateScore(180, gameId);
  }

  return <Button onClick={() => scoreUpdate()}>Update score</Button>;
}
