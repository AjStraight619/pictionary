"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { handleWebSocketMessage } from "@/lib/viewer-canvas";

export type ViewerCanvasTestProps = {
  roomId: string;
  userId: string;
};

export type PencilDraft = {
  path: string;
  strokeWidth: number;
  stroke: string;
};

export default function ViewerCanvas({
  userId,
  roomId,
}: ViewerCanvasTestProps) {
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const svgElementsMap = useRef<Map<string, SVGElement>>(new Map());

  const [pencilDraft, setPencilDraft] = useState<PencilDraft | null>(null);

  const { lastMessage } = useCustomWebSocket({
    roomId,
    userId,
    messageType: "drawing",
  });

  const clearSvgContainer = () => {
    if (svgContainerRef.current) {
      while (svgContainerRef.current.firstChild) {
        const firstChild = svgContainerRef.current.firstChild;
        if (!firstChild) return;
        try {
          if (svgContainerRef.current.contains(firstChild)) {
            svgContainerRef.current.removeChild(firstChild);
          }
        } catch (err) {
          console.error("Error while clearing container: ", err);
        }
      }
      svgElementsMap.current.clear();
    }
  };

  const deleteObjectById = (id: string) => {
    const isElementInMap = svgElementsMap.current.delete(id);
    if (isElementInMap && svgContainerRef.current) {
      const elementToRemove = svgContainerRef.current?.getElementById(id);
      if (!elementToRemove) return;
      elementToRemove.remove();
    }
  };

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage({
        lastMessage,
        svgContainerRef,
        svgElementsMap,
        setPencilDraft,
        clearSvgContainer,
        deleteObjectById,
      });
    }
  }, [lastMessage]);

  const memoizedPencilDraft = useMemo(() => pencilDraft, [pencilDraft]);

  return (
    <svg ref={svgContainerRef} className="w-full h-full rounded-md bg-gray-50">
      {memoizedPencilDraft?.path && memoizedPencilDraft.path.length > 0 && (
        <path
          d={memoizedPencilDraft.path}
          strokeWidth={memoizedPencilDraft?.strokeWidth}
          stroke={memoizedPencilDraft?.stroke}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDashoffset={0}
          strokeMiterlimit={10}
          strokeDasharray="none"
        />
      )}
    </svg>
  );
}
