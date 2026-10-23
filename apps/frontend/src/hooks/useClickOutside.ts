/**
 * useClickOutside — click-outside detection hook.
 * Returns a ref to attach to the element. When a click occurs outside it,
 * the callback fires.
 */

import { useEffect, useRef } from "react";

export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
): React.RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [callback]);

  return ref;
}
