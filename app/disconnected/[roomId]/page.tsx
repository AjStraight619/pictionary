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
      return 'You were disconnected due to inactivity.';
    case DisconnectionReason.NETWORK_ERROR:
      return 'A network error caused the disconnection.';
    case DisconnectionReason.SERVER_SHUTDOWN:
      return 'The server was shut down, leading to disconnection.';
    default:
      return 'You were disconnected for an unknown reason.';
  }
};

const DisconnectedPage = ({ params, searchParams }: DisconnectedPageProps) => {
  const { roomId } = params;
  const userId = searchParams.userId;
  const reason = searchParams.reason as string;

  return (
    <div className="min-h-screen">
      <h1>Disconnected from Room {roomId}</h1>
      <p>{userId && `User ID: ${userId}`}</p>
      <p>{getDisconnectionMessage(reason)}</p>
    </div>
  );
};

export default DisconnectedPage;
