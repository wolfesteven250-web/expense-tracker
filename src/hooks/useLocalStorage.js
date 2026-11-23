import { useEffect, useState } from "react";

export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return initialValue;
      const parsed = JSON.parse(saved);
      if (Array.isArray(initialValue)) return Array.isArray(parsed) ? parsed : initialValue;
      if (initialValue !== null && typeof initialValue === "object") {
        return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : initialValue;
      }
      return typeof parsed === typeof initialValue ? parsed : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (error) { console.error("Could not save data:", error); }
    }, 250);
    return () => clearTimeout(timer);
  }, [key, value]);

  return [value, setValue];
}