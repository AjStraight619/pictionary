// import { updateScore } from '@/actions/score';
// import { useMutation } from '@tanstack/react-query';
// import { usePathname } from 'next/navigation';

// type UseGameStateOptions = {
//   score?: number;
// };

// type GameState = {};

// export const useGameState = ({ score }: UseGameStateOptions) => {
//   const pathname = usePathname();
//   const gameId = pathname.split('/').pop()!;

//   const scoreUpdate = useMutation({
//     mutationFn: () => updateScore(score, gameId),
//   });

//   return {
//     scoreUpdate,
//   };
// };
