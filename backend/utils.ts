import { format } from 'jsr:@std/internal/format';

export function withCors(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type');

  return new Response(response.body, {
    ...response,
    headers: newHeaders,
  });
}

// Helper function to format the timestamp
function formatTimestamp(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')} ${String(
    date.getHours(),
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(
    date.getSeconds(),
  ).padStart(2, '0')}`;
}

export const log = (
  level: string,
  message: string,
  metadata: Record<string, unknown> = {},
) => {
  const timestamp = formatTimestamp(new Date());
  const formattedMetadata = JSON.stringify(
    metadata,
    (key, value) => (key === 'socket' ? 'WebSocket Object' : value), // Replace large objects
    2, // Pretty-print with 2 spaces
  );

  console.log(
    `${timestamp} [${level}] ${message}\nMetadata:\n${formattedMetadata}`,
  );
};

export const logError = (
  message: string,
  metadata: Record<string, unknown> = {},
) => {
  log('ERROR', message, metadata);
};

export const logInfo = (
  message: string,
  metadata: Record<string, unknown> = {},
) => {
  log('INFO', message, metadata);
};

export const logDebug = (
  message: string,
  metadata: Record<string, unknown> = {},
) => {
  log('DEBUG', message, metadata);
};
