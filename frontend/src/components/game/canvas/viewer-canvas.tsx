import { useCustomWebsocket } from "@/hooks/useCustomWebsocket";
import { useCallback, useEffect, useRef, useState } from "react";
import pako from "pako";
import ActiveCursor from "./active-cursor";

export type PencilDraft = {
  path: string;
  strokeWidth: number;
  stroke: string;
};

const ViewerCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const svgElementsMap = useRef<Map<string, SVGElement>>(new Map());
  const drawingQueue = useRef<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);

  const { lastMessage } = useCustomWebsocket({
    messageTypes: ["drawing", "shape", "remove-all", "remove-element"],
  });

  // Function to resize container and maintain 4:3 aspect ratio
  const resizeContainer = useCallback(() => {
    if (!containerRef.current || !svgContainerRef.current) return;

    const parentElement = containerRef.current.parentElement;
    if (!parentElement) return;

    const parentWidth = parentElement.clientWidth;
    const parentHeight = parentElement.clientHeight;

    // Determine the maximum size the container can be while maintaining 4:3
    let containerWidth, containerHeight;

    if (parentWidth / parentHeight > 4 / 3) {
      // Parent is wider than 4:3, so height is the limiting factor
      containerHeight = parentHeight;
      containerWidth = containerHeight * (4 / 3);
    } else {
      // Parent is taller than 4:3, so width is the limiting factor
      containerWidth = parentWidth;
      containerHeight = containerWidth * (3 / 4);
    }

    // Set container size explicitly to maintain 4:3 aspect ratio
    containerRef.current.style.width = `${containerWidth}px`;
    containerRef.current.style.height = `${containerHeight}px`;
  }, []);

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

  // Add resize listener
  useEffect(() => {
    // Initial resize
    resizeContainer();

    // Add resize event listener
    const handleResize = () => {
      resizeContainer();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      svgElementsMap.current.clear();
      drawingQueue.current = [];
    };
  }, [resizeContainer]);

  // Add keypress handler for debug mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle debug mode with Ctrl+D
      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg relative flex items-center justify-center"
      id="viewer-canvas-container"
    >
      <ActiveCursor />
      <svg
        id="viewer-canvas"
        className="w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
        ref={svgContainerRef}
      />

      {debugMode && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-70 text-white p-2 z-50 text-xs">
          <div>
            Container: {containerRef.current?.clientWidth}x
            {containerRef.current?.clientHeight}
          </div>
          <div>Press Ctrl+D to hide debug</div>
        </div>
      )}
    </div>
  );
};

export default ViewerCanvas;
