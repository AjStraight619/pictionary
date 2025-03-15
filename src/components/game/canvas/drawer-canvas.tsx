// import * as fabric from "fabric";
// import { useEffect, useRef, useState } from "react";
// import {
//   handleCanvasMouseDown,
//   handleCanvasMouseMove,
//   handleKeyDownEvents,
//   handleMouseUp,
//   handleObjectModified,
//   handlePathCreated,
//   initializeCanvas,
// } from "@/utils/canvas";
// import { SelectedTool, ShapeData } from "@/types/canvas";
// import Toolbar from "./tools/toolbar";

// import { FreeHandData } from "@/types/game";
// import { useDebouncedCallback, useThrottledCallback } from "use-debounce";
// import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";

// const DrawerCanvas = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const fabricRef = useRef<fabric.Canvas | null>(null);
//   const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);
//   const [selectedTool, setSelectedTool] = useState<SelectedTool>(
//     SelectedTool.Selector
//   );
//   const canvasHistoryRef = useRef<fabric.Object[][]>([]);
//   const historyIndexRef = useRef<number>(-1);
//   const isMouseDownRef = useRef<boolean>(false);
//   const pathDataRef = useRef<fabric.Point[]>([]);
//   const lastUsedColorRef = useRef<string>("#000000");
//   const lastUsedBrushSizeRef = useRef<number>(5);

//   const { sendJsonMessage } = useCustomWebsocket({
//     messageTypes: ["canvas"],
//   });

//   const sendDrawingData = useThrottledCallback((drawingData: FreeHandData) => {
//     sendJsonMessage({
//       type: "drawing",
//       payload: drawingData,
//     });
//   }, 16);

//   const sendSvgShape = useDebouncedCallback((shapeData: ShapeData) => {
//     sendJsonMessage({
//       type: "shape",
//       payload: shapeData,
//     });
//   }, 16);

//   useEffect(() => {
//     const canvas = initializeCanvas({ fabricRef, canvasRef, id: "canvas" });
//     if (!canvas) return;

//     canvas.on("mouse:down", (options) => {
//       handleCanvasMouseDown({
//         options,
//         selectedToolRef,
//         canvas,
//         sendDrawingData,
//         sendSvgShape,
//         isMouseDownRef,
//         pathDataRef,
//         lastUsedColorRef,
//         lastUsedBrushSizeRef,
//       });
//     });

//     canvas.on("mouse:move", (options) => {
//       handleCanvasMouseMove({
//         options,
//         selectedToolRef,
//         canvas,
//         sendDrawingData,
//         isMouseDownRef,
//         pathDataRef,
//         lastUsedColorRef,
//         lastUsedBrushSizeRef,
//       });
//     });

//     canvas.on("path:created", (options) => {
//       const path = options.path;
//       handlePathCreated({ path, sendSvgShape });
//     });

//     canvas.on("mouse:up", () => {
//       handleMouseUp({
//         canvas,
//         selectedToolRef,
//         setSelectedTool,
//         isMouseDownRef,
//         pathDataRef,
//       });
//     });

//     canvas.on("object:modified", () => {
//       handleObjectModified({ canvas, sendSvgShape });
//     });

//     window.addEventListener("keydown", (e) => {
//       handleKeyDownEvents({
//         e,
//         canvas,
//         historyIndexRef,
//         canvasHistoryRef,
//         sendJsonMessage,
//       });
//     });

//     return () => {
//       canvas.dispose();
//       window.removeEventListener("keydown", (e) => {
//         handleKeyDownEvents({
//           e,
//           canvas,
//           historyIndexRef,
//           canvasHistoryRef,
//           sendJsonMessage,
//         });
//       });
//     };
//   }, []);

//   // If the drawer leaves the game or reloads the page, send a message to remove all elements

//   return (
//     <div className="bg-gray-100 rounded-lg shadow-lg relative" id="canvas">
//       <canvas className="w-[800px] h-[600px]" ref={canvasRef} />
//       <Toolbar
//         selectedToolRef={selectedToolRef}
//         canvas={fabricRef.current}
//         selectedTool={selectedTool}
//         setSelectedTool={setSelectedTool}
//         sendJsonMessage={sendJsonMessage}
//         lastUsedColorRef={lastUsedColorRef}
//         lastUsedBrushSizeRef={lastUsedBrushSizeRef}
//       />
//     </div>
//   );
// };

// export default DrawerCanvas;

import type * as fabric from "fabric";
import { useEffect, useRef, useState } from "react";
import {
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleKeyDownEvents,
  handleMouseUp,
  handleObjectModified,
  handlePathCreated,
  initializeCanvas,
} from "@/utils/canvas";
import { SelectedTool, type ShapeData } from "@/types/canvas";

import type { FreeHandData } from "@/types/game";
import { useDebouncedCallback, useThrottledCallback } from "use-debounce";
import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import Toolbar from "@/components/game/canvas/tools/toolbar";

const DrawerCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const selectedToolRef = useRef<SelectedTool>(SelectedTool.Selector);
  const [selectedTool, setSelectedTool] = useState<SelectedTool>(
    SelectedTool.Selector
  );
  const canvasHistoryRef = useRef<fabric.Object[][]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isMouseDownRef = useRef<boolean>(false);
  const pathDataRef = useRef<fabric.Point[]>([]);
  const lastUsedColorRef = useRef<string>("#000000");
  const lastUsedBrushSizeRef = useRef<number>(5);

  const { sendJsonMessage } = useCustomWebsocket({
    messageTypes: ["canvas"],
  });

  const sendDrawingData = useThrottledCallback((drawingData: FreeHandData) => {
    sendJsonMessage({
      type: "drawing",
      payload: drawingData,
    });
  }, 16);

  const sendSvgShape = useDebouncedCallback((shapeData: ShapeData) => {
    sendJsonMessage({
      type: "shape",
      payload: shapeData,
    });
  }, 16);

  // Function to resize canvas when container size changes
  const resizeCanvas = () => {
    if (!fabricRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Maintain aspect ratio (4:3) while fitting in the container
    let canvasWidth, canvasHeight;

    if (containerWidth / containerHeight > 4 / 3) {
      // Container is wider than 4:3, so height is the limiting factor
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * (4 / 3);
    } else {
      // Container is taller than 4:3, so width is the limiting factor
      canvasWidth = containerWidth;
      canvasHeight = containerWidth * (3 / 4);
    }

    fabricRef.current.setWidth(canvasWidth);
    fabricRef.current.setHeight(canvasHeight);
    fabricRef.current.setZoom(canvasWidth / 800); // Scale objects based on original 800px width
    fabricRef.current.renderAll();
  };

  useEffect(() => {
    const canvas = initializeCanvas({ fabricRef, canvasRef, id: "canvas" });
    if (!canvas) return;

    // Set initial size
    if (containerRef.current) {
      const container = containerRef.current;
      canvas.setWidth(container.clientWidth);
      canvas.setHeight(container.clientHeight);
    }

    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        selectedToolRef,
        canvas,
        sendDrawingData,
        sendSvgShape,
        isMouseDownRef,
        pathDataRef,
        lastUsedColorRef,
        lastUsedBrushSizeRef,
      });
    });

    canvas.on("mouse:move", (options) => {
      handleCanvasMouseMove({
        options,
        selectedToolRef,
        canvas,
        sendDrawingData,
        isMouseDownRef,
        pathDataRef,
        lastUsedColorRef,
        lastUsedBrushSizeRef,
      });
    });

    canvas.on("path:created", (options) => {
      const path = options.path;
      handlePathCreated({ path, sendSvgShape });
    });

    canvas.on("mouse:up", () => {
      handleMouseUp({
        canvas,
        selectedToolRef,
        setSelectedTool,
        isMouseDownRef,
        pathDataRef,
      });
    });

    canvas.on("object:modified", () => {
      handleObjectModified({ canvas, sendSvgShape });
    });

    window.addEventListener("keydown", (e) => {
      handleKeyDownEvents({
        e,
        canvas,
        historyIndexRef,
        canvasHistoryRef,
        sendJsonMessage,
      });
    });

    // Add resize listener
    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    // Initial resize
    handleResize();

    return () => {
      canvas.dispose();
      window.removeEventListener("keydown", (e) => {
        handleKeyDownEvents({
          e,
          canvas,
          historyIndexRef,
          canvasHistoryRef,
          sendJsonMessage,
        });
      });
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-white rounded-lg relative flex items-center justify-center"
      id="canvas-container"
    >
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
      <Toolbar
        selectedToolRef={selectedToolRef}
        canvas={fabricRef.current}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        sendJsonMessage={sendJsonMessage}
        lastUsedColorRef={lastUsedColorRef}
        lastUsedBrushSizeRef={lastUsedBrushSizeRef}
      />
    </div>
  );
};

export default DrawerCanvas;
