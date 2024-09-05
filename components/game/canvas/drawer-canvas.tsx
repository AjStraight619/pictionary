'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import {
  initializeFabricCanvas,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handlePathCreated,
  handleCanvasMouseMove,
  handleObjectChange,
  handleMultipleObjectsMoving,
} from '@/lib/canvas';
import Toolbar from '../toolbar';
import { Tool } from '@/types/canvas';
import { useThrottledCallback } from 'use-debounce';
import { FreeHandDrawingData } from '@/types/drawing';
import { useCustomWebSocket } from '@/hooks/useCustomWebsocket';
import { CustomFabricObjectShape } from '@/lib/customFabricObjects';
import { IEvent } from 'fabric/fabric-impl';
import { handleKeyDown } from '@/lib/keyevents';
import pencilCursor from '@/assets/cursors/pencil-cursor.png';

type CanvasProps = {
  userId: string;
  roomId: string;
};

export default function DrawerCanvas({ userId, roomId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isDrawing = useRef(false);
  const selectedToolRef = useRef<Tool | null>(Tool.selector);
  const [selectedTool, setSelectedTool] = useState<Tool>(Tool.selector);
  const activeShapeRef = useRef<fabric.Object | null>(null);
  const selectedShapeRef = useRef<fabric.Object | null>(null);
  const pathDataRef = useRef<fabric.Point[]>([]);
  const lastUsedColorRef = useRef<string>('#000000');
  const lastUsedStrokeWidthRef = useRef<number>(5);
  const isFillActiveRef = useRef<boolean>(false);

  // To handle multiple objects moving at once on the canvas since fabric.js does not support this
  const isMouseDownWithSelectionRef = useRef<boolean>(false);
  const selectedObjectsRef = useRef<fabric.Object[] | undefined>([]);

  const { sendJsonMessage } = useCustomWebSocket({ roomId, userId });

  const sendFreeHandData = useThrottledCallback(
    (freeHandData: FreeHandDrawingData) => {
      sendJsonMessage({
        type: 'drawing',
        compressed: true,
        data: freeHandData,
      });
    },
    5,
  );

  const sendDrawingDataSVG = useThrottledCallback(
    (id: string, svgData: string, shapeType?: string) => {
      sendJsonMessage({
        type: 'drawing',
        compressed: false,
        data: { id, shapeType, svg: svgData },
      });
    },
    16,
  );

  const handleSelectedToolChange = useCallback((tool: Tool) => {
    if (!fabricRef.current) return;
    setSelectedTool(tool);
    selectedToolRef.current = tool;

    if (tool !== Tool.pencil) {
      fabricRef.current.isDrawingMode = false;
      fabricRef.current.hoverCursor = 'default';
      fabricRef.current.defaultCursor = 'default';
    }

    switch (tool) {
      case Tool.selector:
        fabricRef.current.isDrawingMode = false;
        fabricRef.current.hoverCursor = 'default';
        fabricRef.current.defaultCursor = 'default';
        break;
      case Tool.pencil:
        fabricRef.current.isDrawingMode = true;
        fabricRef.current.hoverCursor = 'crosshair';
        fabricRef.current.defaultCursor = 'crosshair';
        fabricRef.current.freeDrawingBrush.width =
          lastUsedStrokeWidthRef.current;
        fabricRef.current.freeDrawingBrush.color = lastUsedColorRef.current;
        break;
      default:
        fabricRef.current.isDrawingMode = false;
        fabricRef.current.hoverCursor = 'default';
        fabricRef.current.defaultCursor = 'default';

        break;
    }
  }, []);

  useEffect(() => {
    const canvas = initializeFabricCanvas({
      canvasRef,
      fabricRef,
    });

    const eventHandler = (options: IEvent) => {
      const obj = options.target as CustomFabricObjectShape;
      handleObjectChange(obj, sendJsonMessage);
    };

    canvas.on('mouse:down', options => {
      handleCanvasMouseDown({
        canvas,
        options,
        isDrawing,
        selectedToolRef,
        pathDataRef,
        activeShapeRef,
        isFillActiveRef,
        sendDrawingDataSVG,
        lastUsedColorRef,
      });
    });

    canvas.on('path:created', options => {
      handlePathCreated({
        options,
        lastUsedColorRef,
        sendDrawingDataSVG,
      });
    });

    canvas.on('mouse:up', () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef: activeShapeRef,
        selectedToolRef,
        setSelectedTool,
      });
      pathDataRef.current = [];
    });

    canvas.on('mouse:move', options => {
      handleCanvasMouseMove({
        canvas,
        options,
        isDrawing,
        shapeRef: activeShapeRef,
        selectedToolRef,
        pathDataRef,
        selectedShapeRef,
        lastUsedColorRef,
        selectedObjectsRef,
        sendFreeHandData,
        lastUsedStrokeWidthRef,
        isMouseDownWithSelectionRef,
      });
    });

    canvas.on('object:modified', options => {
      handleMultipleObjectsMoving({
        canvas,
        options,
        sendJsonMessage,
      });
    });

    canvas.on('object:moving', options => {
      // console.log('Object moving...');
      eventHandler(options);
    });

    canvas.on('object:rotating', eventHandler);

    // Add objects to
    canvas.on('selection:created', options => {});

    // Not sure how to utilize this event listener yet.
    canvas.on('selection:updated', options => {
      // handleSelectionAndInitialPosition(options, selectedObjectsRef);

      console.log('Selection updated..');
    });

    // Clear objects ref
    canvas.on('selection:cleared', () => {});

    window.addEventListener('keydown', e => {
      handleKeyDown({
        e,
        canvas,
        sendJsonMessage,
      });
    });

    return () => {
      canvas.dispose();
      window.removeEventListener('keydown', e => {
        handleKeyDown({
          e,
          canvas,
          sendJsonMessage,
        });
      });
    };
  }, [canvasRef, sendDrawingDataSVG, sendFreeHandData, sendJsonMessage]);

  const handleMouseEnter = () => {
    // TODO: Change cursor based on selected tool here..
    // console.log('Mouse entered...');
    // if (selectedTool === Tool.pencil) {
    //   // console.log('Mouse entered pencil tool selected...');
    //   console.log('Pencil src: ', pencilCursor.src);
    //   // document.body.style.cursor = `url(${pencilCursor.src}), crosshair`;
    //   document.body.style.cursor =
    //     'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/aoDD34AAAAASUVORK5CYII="), crosshair';
    // }
  };

  return (
    <>
      <div
        onMouseEnter={() => handleMouseEnter()}
        onMouseLeave={() => {
          document.body.style.cursor = 'default';
        }}
        className="bg-gray-50 flex-1 w-full h-full rounded-md"
        id="canvas"
      >
        <canvas ref={canvasRef} />
      </div>
      <Toolbar
        lastUsedColorRef={lastUsedColorRef}
        selectedTool={selectedTool}
        handleSelectedToolChange={handleSelectedToolChange}
        canvas={fabricRef}
        sendJsonMessage={sendJsonMessage}
        lastUsedStrokeWidthRef={lastUsedStrokeWidthRef}
        isFillActiveRef={isFillActiveRef}
      />
    </>
  );
}
