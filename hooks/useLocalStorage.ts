import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [firstLoadDone, setFirstLoadDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFirstLoadDone(true);
    }
  }, [key]);

  useEffect(() => {
    if (!firstLoadDone) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.log(error);
    }
  }, [storedValue, firstLoadDone, key]);

  return [storedValue, setStoredValue];
}
