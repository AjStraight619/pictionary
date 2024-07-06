"use client";
import React, { useEffect, useRef, useState } from "react";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { convertPathDataToSvgPathString, decompressMessage } from "@/lib/utils";
import { CustomPath } from "@/lib/customFabricObjects";
import { handleWebSocketMessage } from "@/lib/viewer-canvas";

export type ViewerCanvasTestProps = {
  roomId: string;
  userId: string;
};

export default function ViewerCanvas({
  userId,
  roomId,
}: ViewerCanvasTestProps) {
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const svgElementsMap = useRef<Map<string, SVGElement>>(new Map());

  const [pencilDraft, setPencilDraft] = useState<CustomPath | null>(null);

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
      const parsedMessage = JSON.parse(lastMessage.data);
      if (parsedMessage.compressed) {
        console.log("Message is compressed...");
        const decompressedMessage = decompressMessage(parsedMessage.data);
        handleWebSocketMessage({
          lastMessage: { ...lastMessage, data: decompressedMessage },
          svgContainerRef,
          svgElementsMap,
          setPencilDraft,
          clearSvgContainer,
          deleteObjectById,
        });
      } else {
        handleWebSocketMessage({
          lastMessage,
          svgContainerRef,
          svgElementsMap,
          setPencilDraft,
          clearSvgContainer,
          deleteObjectById,
        });
      }
    }
  }, [lastMessage]);

  return (
    <svg ref={svgContainerRef} className="w-full h-full rounded-md bg-gray-50">
      {pencilDraft?.path && pencilDraft.path.length > 0 && (
        <path
          d={convertPathDataToSvgPathString(
            pencilDraft?.path as unknown as (string | number)[][]
          )}
          strokeWidth={pencilDraft?.strokeWidth}
          stroke={pencilDraft?.stroke}
          fill="none"
        />
      )}
    </svg>
  );
}
