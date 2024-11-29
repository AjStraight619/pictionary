import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';
import { Mouse } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Cursor = {
  x: number;
  y: number;
};

const ViewerCanvas = () => {
  // const [cursors, setCursors] = useState<Cursor[]>([]);

  // // Mock: Update cursor positions dynamically (replace with real-time data).
  // useEffect(() => {
  //   const mockCursors = [
  //     { id: 'user1', x: 100, y: 150 },
  //     { id: 'user2', x: 300, y: 200 },
  //   ];
  //   setCursors(mockCursors);
  // }, []);

  const [activeCursor, setActiveCursor] = useState<Cursor | null>(null);

  const { lastMessage } = useCustomWebsocket({
    messageTypes: ['cursor'],
    queryParams: {},
  });

  useEffect(() => {
    if (lastMessage) {
      const cursor = JSON.parse(lastMessage.data) as Cursor;
      setActiveCursor(cursor);
    }
  }, [lastMessage]);

  return (
    <div
      className="bg-gray-100 rounded-lg shadow-lg relative"
      id="viewer-canvas"
      style={{ width: '800px', height: '600px' }}
    >
      <Mouse
        style={{
          position: 'absolute',
          left: `${activeCursor?.x}px`, // Horizontal position
          top: `${activeCursor?.y}px`, // Vertical position
          transform: 'translate(-50%, -50%)', // Center the cursor icon
          color: 'blue', // Cursor color
        }}
      />

      <canvas className="absolute w-full h-full" />
    </div>
  );
};

export default ViewerCanvas;
