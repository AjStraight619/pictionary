import { useEffect, useState, useCallback } from "react";

export default function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error parsing localStorage value", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    function handler(e: StorageEvent) {
      if (e.key === key) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : defaultValue;
          setValue(newValue);
        } catch (error) {
          console.error("Error parsing localStorage value", error);
        }
      }
    }

    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("storage", handler);
    };
  }, [key, defaultValue]);

  const setValueWrap = useCallback(
    (newValue: T) => {
      try {
        setValue(newValue);
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.error("Error setting localStorage value", error);
      }
    },
    [key]
  );

  return [value, setValueWrap];
}
