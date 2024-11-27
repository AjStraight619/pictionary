import * as fabric from 'fabric';
import { useEffect, useRef, useState } from 'react';
import { handleCanvasMouseDown, initializeCanvas } from '../../utils/canvas';
import { SelectedTool } from '@/types/canvas';
import Toolbar from './tools/toolbar';

const CanvasComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Selected tool:', selectedToolRef.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = initializeCanvas({ fabricRef, canvasRef });
    if (!canvas) return;

    canvas.on('mouse:down', e => {
      handleCanvasMouseDown(e);
    });

    return () => {
      canvas.dispose();
    };
  }, []);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="bg-gray-400 rounded-lg shadow-lg relative" id="canvas">
        <canvas className="w-[800px] h-[600px]" ref={canvasRef} />
        <Toolbar selectedToolRef={selectedToolRef} />
      </div>
    </div>
  );
};

export default CanvasComponent;
