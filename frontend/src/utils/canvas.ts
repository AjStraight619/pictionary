import { SelectedTool } from '@/types/canvas';
import * as fabric from 'fabric';

export const initializeCanvas = ({
  canvasRef,
  fabricRef,
}: {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  fabricRef: React.MutableRefObject<fabric.Canvas | null>;
}) => {
  if (!canvasRef.current) return;
  const canvasElement = document.getElementById('canvas');

  const canvas = new fabric.Canvas(canvasRef.current, {
    width: canvasElement?.clientWidth,
    height: canvasElement?.clientHeight,
  });

  fabricRef.current = canvas;

  return canvas;
};

const onSelectorDown = () => {};

const onPencilDown = (
  selectedToolRef: React.MutableRefObject<SelectedTool>,
  canvas: fabric.Canvas,
) => {
  console.log("Pencil's down");

  canvas.isDrawingMode = true;
};

const onEraserDown = (
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>,
  canvas: fabric.Canvas,
) => {
  const objects = canvas.getObjects();
  const target = options.target;

  // const eraserBrush = new EraserBrush(canvas);
  // canvas.freeDrawingBrush = eraserBrush;
  // canvas.freeDrawingBrush.color = 'rgba(255,255,255,1)';
  // canvas.freeDrawingBrush.width = 10;
  // canvas.isDrawingMode = true;
  // console.log('Eraser is selected');
};

export const handleCanvasMouseDown = ({
  options,
  selectedToolRef,
  canvas,
}: {
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>;
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas;
}) => {
  // const target = options.target;
  // console.log('x', options.viewportPoint.x);
  // console.log('y', options.viewportPoint.y);
  canvas.isDrawingMode = false;

  switch (selectedToolRef.current) {
    case SelectedTool.Selector:
      onSelectorDown();
      break;
    case SelectedTool.Pencil:
      console.log('Pencil selected');
      onPencilDown(selectedToolRef, canvas);

      break;
    case SelectedTool.Eraser:
      onEraserDown(options, canvas);
      break;
  }
};

export const handleCanvasMouseMove = ({
  options,
  selectedToolRef,
  canvas,
}: {
  options: fabric.TPointerEventInfo<fabric.TPointerEvent>;
  selectedToolRef: React.MutableRefObject<SelectedTool>;
  canvas: fabric.Canvas;
}) => {
  if (selectedToolRef.current === SelectedTool.Pencil) {
    console.log('Pencil is selected');
    return;
  }
  // console.log('x', e.viewportPoint.x);
  // console.log('y', e.viewportPoint.y);
  // if (selectedToolRef.current === SelectedTool.Pencil) {
  //   canvas.isDrawingMode = true;
  //   canvas.freeDrawingBrush.color = 'black';
  //   canvas.freeDrawingBrush.width = 5;
  //   console.log('Pencil is selected');
  //   return;
  // }
};

export const handleKeyDownEvents = ({
  e,
  canvas,
  historyIndexRef,
  canvasHistoryRef,
}: {
  e: KeyboardEvent;
  canvas: fabric.Canvas;
  historyIndexRef: React.MutableRefObject<number>;
  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>;
}) => {
  // if (!canvas) return;
  const activeObjects = canvas.getActiveObjects();
  console.log('Active objects:', activeObjects);

  // Save history before removing objects
  if (e.key === 'Delete' || e.key === 'Backspace') {
    saveHistory(canvas, canvasHistoryRef, historyIndexRef);
    activeObjects.forEach(object => {
      canvas.remove(object);
    });
  }

  // Handle undo/redo
  if (e.key === 'z' && e.ctrlKey) {
    if (e.shiftKey) {
      redo(canvas, canvasHistoryRef, historyIndexRef);
    } else {
      undo(canvas, canvasHistoryRef, historyIndexRef);
    }
  }
};

const saveHistory = (
  canvas: fabric.Canvas,
  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>,
  historyIndexRef: React.MutableRefObject<number>,
) => {
  const serializedObjects = canvas
    .getObjects()
    .map(obj => obj.toObject(['id', 'customProperty']));

  // Trim future history if we overwrite it
  if (historyIndexRef.current < canvasHistoryRef.current.length - 1) {
    canvasHistoryRef.current = canvasHistoryRef.current.slice(
      0,
      historyIndexRef.current + 1,
    );
  }

  canvasHistoryRef.current.push(serializedObjects);
  historyIndexRef.current++;
  console.log('History saved:', canvasHistoryRef.current);
};

export const undo = (
  canvas: fabric.Canvas,
  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>,
  historyIndexRef: React.MutableRefObject<number>,
) => {
  if (historyIndexRef.current > 0) {
    historyIndexRef.current--;
    const previousState = canvasHistoryRef.current[historyIndexRef.current];
    restoreCanvasState(canvas, previousState);
  } else {
    console.log('No more undo steps.');
  }
};

export const redo = (
  canvas: fabric.Canvas,
  canvasHistoryRef: React.MutableRefObject<fabric.FabricObject[][]>,
  historyIndexRef: React.MutableRefObject<number>,
) => {
  if (historyIndexRef.current < canvasHistoryRef.current.length - 1) {
    historyIndexRef.current++;
    const nextState = canvasHistoryRef.current[historyIndexRef.current];
    restoreCanvasState(canvas, nextState);
  } else {
    console.log('No more redo steps.');
  }
};

const restoreCanvasState = (
  canvas: fabric.Canvas,
  state: fabric.FabricObject[],
) => {
  console.log('Restoring canvas state:', state);

  // Clear the canvas
  canvas.clear();

  // Enliven objects and add them to the canvas
  fabric.util.enlivenObjects(state, objects => {
    if (objects.length === 0) {
      console.error('No objects to restore');
    }
    objects.forEach(obj => {
      console.log('Adding object to canvas:', obj);
      canvas.add(obj);
    });

    // Render the canvas after adding objects
    canvas.renderAll();
  });
};
