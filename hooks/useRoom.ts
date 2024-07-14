import { usePathname } from 'next/navigation';

// TODO: Add more functionality to this to control room state

export const useRoom = () => {
  const pathname = usePathname();
  const roomId = pathname.split('/').pop()!;

  return { roomId };
};
