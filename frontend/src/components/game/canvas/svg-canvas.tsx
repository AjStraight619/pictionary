import { useCustomWebsocket } from '@/hooks/useCustomWebsocket';
import { useEffect, useRef, useState } from 'react';
import pako from 'pako';

export type PencilDraft = {
  path: string;
  strokeWidth: number;
  stroke: string;
};

export const SVGCanvas = () => {
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const svgElementsMap = useRef<Map<string, SVGElement>>(new Map());

  const [pencilDraft, setPencilDraft] = useState<PencilDraft | null>(null);

  const { lastMessage } = useCustomWebsocket({
    messageTypes: ['drawing', 'shape', 'remove-all', 'remove-element'],
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
          console.error('Error while clearing container: ', err);
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

  const renderSvg = (svgData: string, id: string) => {
    if (!svgContainerRef.current) return;

    // Check if the element already exists
    let element = svgElementsMap.current.get(id);
    if (element) {
      console.log(`Updating SVG with ID ${id}`);
      // Replace the entire element to ensure transforms are applied correctly
      const wrapper = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g',
      );
      wrapper.innerHTML = svgData;
      const newElement = wrapper.firstChild as SVGElement;

      element.replaceWith(newElement);
      svgElementsMap.current.set(id, newElement);
      return;
    }

    // Create and append a new SVG element if it doesn’t exist
    const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    wrapper.innerHTML = svgData;
    element = wrapper.firstChild as SVGElement;

    if (element) {
      element.setAttribute('id', id);
      svgContainerRef.current.appendChild(element);
      svgElementsMap.current.set(id, element);
    }
  };

  useEffect(() => {
    if (lastMessage) {
      try {
        const parsedMessage = JSON.parse(lastMessage.data);
        switch (parsedMessage.type) {
          case 'drawing': {
            setPencilDraft({
              stroke: parsedMessage.payload.stroke,
              strokeWidth: parsedMessage.payload.strokeWidth,
              path: parsedMessage.payload.path,
            });
            break;
          }

          case 'shape': {
            const { id, type } = parsedMessage.payload; // Declare type as const since it’s never reassigned
            let { svg } = parsedMessage.payload; // Use let for svg because it can be reassigned

            if (type === 'path') {
              svg = pako.inflate(svg, { to: 'string' }); // Decompress the SVG if it's a path
            }

            renderSvg(svg, id);
            setPencilDraft(null);
            break;
          }
          case 'remove-element': {
            const { id: removeElementId } = parsedMessage.payload;
            console.log('Remove element id: ', removeElementId);
            deleteObjectById(removeElementId);
            break;
          }

          case 'remove-all': {
            clearSvgContainer();
            break;
          }

          default: {
            console.log('unknown type, we are breaking');
          }
        }
      } catch (e) {
        console.error(
          'Dont know what went wrong because try catch is like that: ',
          e,
        );
      }
    }
  }, [lastMessage]);
  return (
    <svg
      id="viewer-canvas"
      className="w-[800px] h-[600px] rounded-md bg-gray-100"
      ref={svgContainerRef}
    >
      {pencilDraft?.path && pencilDraft.path.length > 0 && (
        <path
          d={pencilDraft.path}
          strokeWidth={pencilDraft.strokeWidth}
          stroke={pencilDraft.stroke}
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
};
