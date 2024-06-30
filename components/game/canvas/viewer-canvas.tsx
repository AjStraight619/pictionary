"use client";
import React, { useEffect, useRef, useState } from "react";
import { useCustomWebSocket } from "@/hooks/useCustomWebsocket";
import { convertPathDataToSvgPathString } from "@/lib/utils";
import { CustomPath } from "@/lib/customFabricObjects";

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
        if (!svgContainerRef.current.firstChild) return;
        try {
          svgContainerRef.current.removeChild(
            svgContainerRef.current.firstChild
          );
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
    if (lastMessage && svgContainerRef.current) {
      try {
        const parsedData = JSON.parse(lastMessage.data);
        const { id, svg } = parsedData.data;

        if (parsedData.data.type === "pencil") {
          setPencilDraft(parsedData.data.shapeData);
          return;
        }

        if (parsedData.data.shapeType === "path") {
          setPencilDraft(null);
        }

        if (parsedData.data.svg === "delete") {
          clearSvgContainer();
          return;
        }

        if (svg.action === "deleteById") {
          try {
            deleteObjectById(svg.id);
          } catch (err) {
            console.error("Err: ", err);
          }
        }

        if (id && svg) {
          let element = svgElementsMap.current.get(id);

          if (!element) {
            // If the element doesn't exist, create it
            const wrapper = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            wrapper.innerHTML = svg;
            element = wrapper.firstChild as SVGElement;

            // Debug: Ensure element is correctly created
            console.log("Creating new element:", element);

            svgContainerRef.current.appendChild(element);
            svgElementsMap.current.set(id, element);
          } else {
            // Update existing element
            const wrapper = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            wrapper.innerHTML = svg;
            const newElement = wrapper.firstChild as SVGElement;

            // Debug: Ensure element is correctly updated
            console.log("Updating element:", newElement);

            element.replaceWith(newElement);
            svgElementsMap.current.set(id, newElement);
          }
        }
      } catch (error) {
        console.error("Failed to parse message data: ", error);
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
