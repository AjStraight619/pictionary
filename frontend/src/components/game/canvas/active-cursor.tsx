import { useActiveCursor } from "@/hooks/useGameSelector";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

const ActiveCursor = () => {
  const cursor = useActiveCursor();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !cursor) return null;

  // Get canvas element directly - must use the actual canvas, not the container
  const canvasElement = document.querySelector("#canvas-container canvas");
  if (!canvasElement) return null;

  const canvasRect = canvasElement.getBoundingClientRect();

  // Convert percentage coordinates to absolute screen positions
  // cursor.x and cursor.y are percentages (0-1) of canvas dimensions
  const screenX = canvasRect.left + cursor.x * canvasRect.width;
  const screenY = canvasRect.top + cursor.y * canvasRect.height;

  return createPortal(
    <div
      className="fixed pointer-events-none z-[9999]"
      style={{
        left: screenX,
        top: screenY,
        width: "10px",
        height: "10px",
        backgroundColor: cursor.color || "#ff0000",
        borderRadius: "50%",
        border: "1px solid white",
        outline: "1px solid black",
        transform: "translate(-50%, -50%)",
      }}
    />,
    document.body
  );
};

export default ActiveCursor;
