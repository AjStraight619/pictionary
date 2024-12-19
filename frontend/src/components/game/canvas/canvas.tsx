import * as fabric from 'fabric';
import { useEffect, useRef, useState } from 'react';
import {
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleKeyDownEvents,
  handlePathCreated,
  initializeCanvas,
} from '@/utils/canvas';
import { SelectedTool, ShapeData } from '@/types/canvas';
import Toolbar from './tools/toolbar';
import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';

import { FreeHandData } from '@/types/game';
import { useThrottledCallback } from 'use-debounce';

const CanvasComponent = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>(
    SelectedTool.Selector,
  );
  const canvasHistoryRef = useRef<fabric.Object[][]>([]); // Array of object arrays
  const historyIndexRef = useRef<number>(-1); // Tracks the current position in history
  const pointBufferRef = useRef<[number, number][]>([]);
  const isMouseDownRef = useRef<boolean>(false);
  const pathDataRef = useRef<fabric.Point[]>([]);

  const { sendJsonMessage } = useCustomWebsocket({
    messageTypes: ['canvas'],
  });

  const sendDrawingData = useThrottledCallback((drawingData: FreeHandData) => {
    sendJsonMessage({
      type: 'drawing',
      payload: drawingData,
    });
  }, 16);

  const sendSvgShape = (shapeData: ShapeData) => {
    console.log('sending svg shape: ', shapeData);
    sendJsonMessage({
      type: 'shape',
      payload: shapeData,
    });
  };

  useEffect(() => {
    const canvas = initializeCanvas({ fabricRef, canvasRef, id: 'canvas' });
    if (!canvas) return;

    canvas.on('mouse:down', options => {
      handleCanvasMouseDown({
        options,
        selectedToolRef,
        canvas,
        sendDrawingData,
        sendSvgShape,
        isMouseDownRef,
        pathDataRef,
      });
    });

    canvas.on('mouse:move', options => {
      handleCanvasMouseMove({
        options,
        selectedToolRef,
        canvas,
        sendDrawingData,
        isMouseDownRef,
        pointBufferRef,
        pathDataRef,
      });
    });

    canvas.on('path:created', options => {
      const path = options.path;
      handlePathCreated({ path, sendSvgShape });
    });
    canvas.on('mouse:up', () => {
      isMouseDownRef.current = false;
      pathDataRef.current = [];
      setTimeout(() => {
        if (selectedToolRef.current !== SelectedTool.Pencil) {
          setTimeout(() => {
            canvas.selection = true;
            selectedToolRef.current = SelectedTool.Selector;
            setSelectedTool(SelectedTool.Selector);
          }, 300);
        }
      });
    });

    canvas.on('selection:created', options => {
      //const activeObjects = canvas.getActiveObjects()
      //const allObjects = canvas.getObjects()
      //console.log("Active objects: ", activeObjects)
      //console.log("All objects?: ", allObjects)
    });

    //canvas.on("object:modified", options => {
    //  console.log("object modified")
    //  const activeSelection = options.target
    //  console.log("Active selection: ", activeSelection)
    //  canvas.renderAll()
    //  const objects = canvas.getActiveObjects()
    //  objects.forEach((obj) => {
    //    // @ts-ignore
    //    //obj.setCoords()
    //    const id = obj.id
    //    const svgShape = obj.toSVG()
    //    const xy = obj.getXY()
    //    // @ts-ignore
    //    console.log("xy after update: ", obj.id, "\npostion: ", xy)
    //    const shapeData: ShapeData = {
    //      id: id,
    //      svg: svgShape
    //    }
    //    sendSvgShape(shapeData)
    //
    //  })
    //})

    canvas.on('object:modified', options => {
      console.log('object modified');

      const objects = canvas.getActiveObjects();
      objects.forEach(obj => {
        const id = obj.id;
        let svgShape = obj.toSVG();

        // Calculate absolute transform matrix.
        const absoluteMatrix = obj.calcTransformMatrix();
        const [a, b, c, d, e, f] = absoluteMatrix;

        // Construct the absolute transform attribute.
        const absoluteTransform = `transform="matrix(${a} ${b} ${c} ${d} ${e} ${f})"`;

        // Replace the object's transform in the SVG with our computed absolute transform.
        svgShape = svgShape.replace(
          /transform="matrix\([^)]+\)"/,
          absoluteTransform,
        );

        const shapeData = { id, svg: svgShape };
        console.log('sending svg shape: ', shapeData);
        sendSvgShape(shapeData);
      });
    });

    window.addEventListener('keydown', e => {
      handleKeyDownEvents({
        e,
        canvas,
        historyIndexRef,
        canvasHistoryRef,
        sendJsonMessage,
      });
    });

    return () => {
      canvas.dispose();
      window.removeEventListener('keydown', e => {
        handleKeyDownEvents({
          e,
          canvas,
          historyIndexRef,
          canvasHistoryRef,
          sendJsonMessage,
        });
      });
    };
  }, []);

  return (
    <div className="flex flex-col gap-y-2">
      <div className="bg-gray-100 rounded-lg shadow-lg relative" id="canvas">
        <canvas className="w-[800px] h-[600px]" ref={canvasRef} />
        <Toolbar
          selectedToolRef={selectedToolRef}
          canvas={fabricRef.current}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          sendJsonMessage={sendJsonMessage}
        />
      </div>
    </div>
  );
};

export default CanvasComponent;
