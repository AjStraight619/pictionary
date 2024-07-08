import React from "react";
import { CustomPath } from "@/lib/customFabricObjects";
import { decompressMessage } from "./utils";
import { FreeHandDrawingData } from "@/types/drawing";
import { PencilDraft } from "@/components/game/canvas/viewer-canvas";

type HandleWebSocketMessageParams = {
  lastMessage: MessageEvent<any>;
  svgContainerRef: React.MutableRefObject<SVGSVGElement | null>;
  svgElementsMap: React.MutableRefObject<Map<string, SVGElement>>;
  setPencilDraft: React.Dispatch<React.SetStateAction<PencilDraft | null>>;
  clearSvgContainer: () => void;
  deleteObjectById: (id: string) => void;
};

export const handleWebSocketMessage = ({
  lastMessage,
  svgContainerRef,
  svgElementsMap,
  setPencilDraft,
  clearSvgContainer,
  deleteObjectById,
}: HandleWebSocketMessageParams) => {
  try {
    const parsedData = JSON.parse(lastMessage.data);
    const { id, svg } = parsedData.data;

    if (parsedData.data.type === "pencil" && parsedData.compressed) {
      setPencilDraft({
        stroke: parsedData.data.stroke,
        strokeWidth: parsedData.data.strokeWidth,
        path: decompressMessage(parsedData.data.path),
      });
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
        console.error("Error while deleting object by ID: ", err);
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

        svgContainerRef.current?.appendChild(element);
        svgElementsMap.current.set(id, element);
      } else {
        // Update existing element
        const wrapper = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g"
        );
        wrapper.innerHTML = svg;
        const newElement = wrapper.firstChild as SVGElement;

        element.replaceWith(newElement);
        svgElementsMap.current.set(id, newElement);
      }
    }
  } catch (error) {
    console.error("Failed to parse message data: ", error);
  }
};
