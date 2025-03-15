// import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
// import { useCallback, useEffect, useRef } from "react";
// import pako from "pako";

// export type PencilDraft = {
//   path: string;
//   strokeWidth: number;
//   stroke: string;
// };

// const ViewerCanvas = () => {
//   const svgContainerRef = useRef<SVGSVGElement>(null);
//   const svgElementsMap = useRef<Map<string, SVGElement>>(new Map());
//   const drawingQueue = useRef<string[]>([]);

//   const { lastMessage } = useCustomWebsocket({
//     messageTypes: ["drawing", "shape", "remove-all", "remove-element"],
//   });

//   // Debounced function to process the drawing queue
//   const processDrawingQueue = useCallback(
//     (strokeWidth: number, stroke: string) => {
//       if (!svgContainerRef.current || drawingQueue.current.length === 0) return;

//       const combinedPath = drawingQueue.current.join(" ");
//       drawingQueue.current = [];

//       updateLivePath(combinedPath, strokeWidth, stroke);
//     },
//     []
//   );

//   // Function to update or create the live path element
//   const updateLivePath = (
//     path: string,
//     strokeWidth: number,
//     stroke: string
//   ) => {
//     if (!svgContainerRef.current) return;

//     let livePath = svgContainerRef.current.querySelector(
//       "path[data-live='true']"
//     ) as SVGPathElement;

//     if (!livePath) {
//       livePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
//       livePath.setAttribute("data-live", "true");
//       livePath.setAttribute("stroke", stroke);
//       livePath.setAttribute("stroke-width", String(strokeWidth));
//       livePath.setAttribute("fill", "none");
//       livePath.setAttribute("stroke-linejoin", "round");
//       livePath.setAttribute("stroke-linecap", "round");
//       svgContainerRef.current.appendChild(livePath);
//     }

//     livePath.setAttribute("stroke", stroke);
//     livePath.setAttribute("stroke-width", String(strokeWidth));

//     livePath.setAttribute("d", path);
//   };

//   // Function to clear the entire SVG container
//   const clearSvgContainer = useCallback(() => {
//     if (!svgContainerRef.current) return;

//     Array.from(svgContainerRef.current.children).forEach((child) => {
//       svgContainerRef.current?.removeChild(child);
//     });

//     svgElementsMap.current.clear();
//   }, []);

//   // Function to delete an element by ID
//   const deleteObjectById = (id: string) => {
//     const elementToRemove = svgContainerRef.current?.getElementById(id);
//     if (!elementToRemove) {
//       console.warn(`Element with ID ${id} not found or already removed.`);
//       return;
//     }

//     try {
//       svgContainerRef.current?.removeChild(elementToRemove);
//       svgElementsMap.current.delete(id);
//     } catch (err) {
//       console.error(`Failed to remove element with ID ${id}:`, err);
//     }
//   };

//   // Function to render SVG shapes
//   const renderSvg = (svgData: string, id: string) => {
//     if (!svgContainerRef.current) return;

//     let element = svgElementsMap.current.get(id);

//     if (!element) {
//       element = document.createElementNS("http://www.w3.org/2000/svg", "g");
//       element.setAttribute("id", id);
//       svgContainerRef.current.appendChild(element);
//       svgElementsMap.current.set(id, element);
//     }

//     element.innerHTML = svgData;
//   };

//   // Handle incoming WebSocket messages
//   useEffect(() => {
//     if (!lastMessage) return;

//     try {
//       const parsedMessage = JSON.parse(lastMessage.data);
//       switch (parsedMessage.type) {
//         case "drawing": {
//           const { path, strokeWidth, stroke } = parsedMessage.payload;

//           console.log("Stroke: ", stroke);
//           drawingQueue.current.push(path);
//           processDrawingQueue(strokeWidth, stroke);
//           break;
//         }
//         case "shape": {
//           const { id, type } = parsedMessage.payload;
//           let { svg } = parsedMessage.payload;

//           if (type === "path") {
//             svg = pako.inflate(svg, { to: "string" });
//           }

//           renderSvg(svg, id);
//           break;
//         }
//         case "remove-element": {
//           const { id: removeElementId } = parsedMessage.payload;
//           deleteObjectById(removeElementId);
//           break;
//         }
//         case "remove-all": {
//           clearSvgContainer();
//           break;
//         }
//         default: {
//           console.log("Unknown message type:", parsedMessage.type);
//         }
//       }
//     } catch (e) {
//       console.error("Error processing message:", e);
//     }
//   }, [lastMessage, processDrawingQueue, clearSvgContainer]);

//   useEffect(() => {
//     return () => {
//       svgElementsMap.current.clear();
//       drawingQueue.current = [];
//     };
//   }, []);

//   return (
//     <svg
//       id="viewer-canvas"
//       className="w-[800px] h-[600px] rounded-md bg-gray-100"
//       ref={svgContainerRef}
//     />
//   );
// };

// export default ViewerCanvas;

import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useCallback, useEffect, useRef } from "react";
import pako from "pako";

export type PencilDraft = {
  path: string;
  strokeWidth: number;
  stroke: string;
};

const ViewerCanvas = () => {
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const svgElementsMap = useRef<Map<string, SVGElement>>(new Map());
  const drawingQueue = useRef<string[]>([]);

  const { lastMessage } = useCustomWebsocket({
    messageTypes: ["drawing", "shape", "remove-all", "remove-element"],
  });

  // Debounced function to process the drawing queue
  const processDrawingQueue = useCallback(
    (strokeWidth: number, stroke: string) => {
      if (!svgContainerRef.current || drawingQueue.current.length === 0) return;

      const combinedPath = drawingQueue.current.join(" ");
      drawingQueue.current = [];

      updateLivePath(combinedPath, strokeWidth, stroke);
    },
    []
  );

  // Function to update or create the live path element
  const updateLivePath = (
    path: string,
    strokeWidth: number,
    stroke: string
  ) => {
    if (!svgContainerRef.current) return;

    let livePath = svgContainerRef.current.querySelector(
      "path[data-live='true']"
    ) as SVGPathElement;

    if (!livePath) {
      livePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      livePath.setAttribute("data-live", "true");
      livePath.setAttribute("stroke", stroke);
      livePath.setAttribute("stroke-width", String(strokeWidth));
      livePath.setAttribute("fill", "none");
      livePath.setAttribute("stroke-linejoin", "round");
      livePath.setAttribute("stroke-linecap", "round");
      svgContainerRef.current.appendChild(livePath);
    }

    livePath.setAttribute("stroke", stroke);
    livePath.setAttribute("stroke-width", String(strokeWidth));

    livePath.setAttribute("d", path);
  };

  // Function to clear the entire SVG container
  const clearSvgContainer = useCallback(() => {
    if (!svgContainerRef.current) return;

    Array.from(svgContainerRef.current.children).forEach((child) => {
      svgContainerRef.current?.removeChild(child);
    });

    svgElementsMap.current.clear();
  }, []);

  // Function to delete an element by ID
  const deleteObjectById = (id: string) => {
    const elementToRemove = svgContainerRef.current?.getElementById(id);
    if (!elementToRemove) {
      console.warn(`Element with ID ${id} not found or already removed.`);
      return;
    }

    try {
      svgContainerRef.current?.removeChild(elementToRemove);
      svgElementsMap.current.delete(id);
    } catch (err) {
      console.error(`Failed to remove element with ID ${id}:`, err);
    }
  };

  // Function to render SVG shapes
  const renderSvg = (svgData: string, id: string) => {
    if (!svgContainerRef.current) return;

    let element = svgElementsMap.current.get(id);

    if (!element) {
      element = document.createElementNS("http://www.w3.org/2000/svg", "g");
      element.setAttribute("id", id);
      svgContainerRef.current.appendChild(element);
      svgElementsMap.current.set(id, element);
    }

    element.innerHTML = svgData;
  };

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const parsedMessage = JSON.parse(lastMessage.data);
      switch (parsedMessage.type) {
        case "drawing": {
          const { path, strokeWidth, stroke } = parsedMessage.payload;

          console.log("Stroke: ", stroke);
          drawingQueue.current.push(path);
          processDrawingQueue(strokeWidth, stroke);
          break;
        }
        case "shape": {
          const { id, type } = parsedMessage.payload;
          let { svg } = parsedMessage.payload;

          if (type === "path") {
            svg = pako.inflate(svg, { to: "string" });
          }

          renderSvg(svg, id);
          break;
        }
        case "remove-element": {
          const { id: removeElementId } = parsedMessage.payload;
          deleteObjectById(removeElementId);
          break;
        }
        case "remove-all": {
          clearSvgContainer();
          break;
        }
        default: {
          console.log("Unknown message type:", parsedMessage.type);
        }
      }
    } catch (e) {
      console.error("Error processing message:", e);
    }
  }, [lastMessage, processDrawingQueue, clearSvgContainer]);

  useEffect(() => {
    return () => {
      svgElementsMap.current.clear();
      drawingQueue.current = [];
    };
  }, []);

  // Maintain aspect ratio but fill available space
  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <svg
        id="viewer-canvas"
        className="w-full h-full max-w-full max-h-full object-contain"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        ref={svgContainerRef}
      />
    </div>
  );
};

export default ViewerCanvas;
