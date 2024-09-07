import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/lib/db';
import Link from 'next/link';
import React from 'react';

type DisconnectedPageProps = {
  params: { roomId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

enum DisconnectionReason {
  INACTIVITY = 'inactivity',
  NETWORK_ERROR = 'network_error',
  SERVER_SHUTDOWN = 'server_shutdown',
  UNKNOWN = 'unknown',
}

const getDisconnectionMessage = (reason: string | undefined): string => {
  switch (reason) {
    case DisconnectionReason.INACTIVITY:
      return 'You were disconnected due to inactivity';
    case DisconnectionReason.NETWORK_ERROR:
      return 'A network error caused the disconnection';
    case DisconnectionReason.SERVER_SHUTDOWN:
      return 'The server was shut down, leading to disconnection';
    default:
      return 'You were disconnected for an unknown reason';
  }
};

const getRoomName = async (roomId: string) => {
  try {
    const room = await db.game.findFirst({
      where: { id: roomId },
      select: { name: true },
    });

    return room
      ? { roomName: room.name, error: false }
      : { error: false, noRoom: true };
  } catch (error) {
    console.error('Error fetching room: ', error);
    return { error: true, noRoom: true };
  }
};

const renderDisconnectionMessage = (
  room: { roomName?: string; error: boolean; noRoom?: boolean },
  reason: string | undefined,
) => {
  if (room.error) {
    return 'An error occurred while fetching room information.';
  }

  if (room.noRoom) {
    return 'The room does not exist.';
  }

  if (room.roomName) {
    const disconnectionMessage = getDisconnectionMessage(reason);
    return `${disconnectionMessage} from ${room.roomName}.`;
  }

  return 'You were disconnected.';
};

const DisconnectedPage = async ({
  params,
  searchParams,
}: DisconnectedPageProps) => {
  const { roomId } = params;
  const userId = searchParams.userId;
  const reason = searchParams.reason as string;

  const room = await getRoomName(roomId);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Disconnected</CardTitle>
        </CardHeader>
        <CardContent>{renderDisconnectionMessage(room, reason)}</CardContent>
        <CardFooter>
          <div className="space-x-2">
            <Button asChild>
              <Link href={`/room/${roomId}`}>Rejoin Room</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={``}>Return To Home</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DisconnectedPage;
