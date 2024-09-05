import { proceedGame } from '@/actions/game';
import { Button } from '../ui/button';
import TestStartTimer from './test-start-timer';
import UpdateScoreTest from './update-score';
import { startNewRound } from '@/actions/round';

type TestProps = {
  gameId: string;
};

export default function Test({ gameId }: TestProps) {
  return (
    <div className="bg-white rounded-md w-full flex gap-x-2 items-center justify-start p-4">
      <p className="font-sans text-muted-foreground">Test:</p>
      <UpdateScoreTest />
      <TestStartTimer />
      <form
        action={async () => {
          'use server';
          await startNewRound(gameId as string);
        }}
      >
        <Button type="submit">Proceed Game</Button>
      </form>
    </div>
  );
}
