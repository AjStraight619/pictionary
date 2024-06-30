import { useEffect, useRef } from "react";

export const useRenderRef = () => {
  const renderRef = useRef(0);

  useEffect(() => {
    renderRef.current++;
  });

  return renderRef.current;
};
