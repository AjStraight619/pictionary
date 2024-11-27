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

  console.log('canvasElemet', canvasElement);
  console.log('canvasElement?.clientWidth', canvasElement?.clientWidth);
  console.log('canvasElement?.clientHeight', canvasElement?.clientHeight);

  const canvas = new fabric.Canvas(canvasRef.current, {
    width: canvasElement?.clientWidth,
    height: canvasElement?.clientHeight,
  });

  fabricRef.current = canvas;

  return canvas;
};

export const handleCanvasMouseDown = (e: fabric.TEvent) => {
  console.log(e.e);
};
