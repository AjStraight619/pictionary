import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

type RoomActionWrapperProps = {
  children: ReactNode;
};

export default function RoomActionWrapper({
  children,
}: RoomActionWrapperProps) {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Create or Join a Room</CardTitle>
        <CardDescription>
          Create or join a room and invite your friends to play!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}
