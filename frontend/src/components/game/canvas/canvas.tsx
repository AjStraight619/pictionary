import * as fabric from 'fabric';
import { useEffect, useRef } from 'react';
import {
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleKeyDownEvents,
  initializeCanvas,
} from '@/utils/canvas';
import { SelectedTool } from '@/types/canvas';
import Toolbar from './tools/toolbar';
import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';

const CanvasComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);

  const canvasHistoryRef = useRef<fabric.Object[][]>([]); // Array of object arrays
  const historyIndexRef = useRef<number>(-1); // Tracks the current position in history

  const ref = useRef(0);

  useEffect(() => {
    ref.current++;
    console.log('Canvas component re rendered: ', ref.current);
  });

  const { lastMessage, connectionStatus } = useCustomWebsocket({
    messageTypes: ['canvas'],
  });

  useEffect(() => {
    const canvas = initializeCanvas({ fabricRef, canvasRef });
    if (!canvas) return;

    canvas.on('mouse:down', options => {
      handleCanvasMouseDown({ options, selectedToolRef, canvas });
    });

    canvas.on('mouse:move', options => {
      handleCanvasMouseMove({ options, selectedToolRef, canvas });
    });

    // canvas.on('mouse:over', () => {
    //   if (selectedToolRef.current === SelectedTool.Pencil) {
    //     canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    //     canvas.freeDrawingBrush.width = 5;
    //     canvas.freeDrawingCursor = 'crosshair';
    //     canvas.isDrawingMode = true;
    //   }
    // });

    canvas.on('mouse:up', () => {});

    window.addEventListener('keydown', e => {
      handleKeyDownEvents({ e, canvas, historyIndexRef, canvasHistoryRef });
    });

    return () => {
      canvas.dispose();
      window.removeEventListener('keydown', e => {
        handleKeyDownEvents({ e, canvas, historyIndexRef, canvasHistoryRef });
      });
    };
  }, []);

  return (
    <div className="flex flex-col gap-y-2">
      <p>Connection status: {connectionStatus}</p>
      <div className="bg-gray-100 rounded-lg shadow-lg relative" id="canvas">
        <canvas className="w-[800px] h-[600px]" ref={canvasRef} />
        <Toolbar selectedToolRef={selectedToolRef} canvas={fabricRef.current} />
      </div>
    </div>
  );
};

export default CanvasComponent;
