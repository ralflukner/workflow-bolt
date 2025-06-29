import { useRef, RefObject } from 'react';

interface UseClickOutsideOptions {
  onClickOutside: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for handling click outside events without useEffect
 * Uses event delegation on the document level
 */
export const useClickOutside = <T extends HTMLElement>({ 
  onClickOutside, 
  enabled = true 
}: UseClickOutsideOptions): RefObject<T> => {
  const ref = useRef<T>(null);

  // Instead of useEffect, we use event handlers directly on elements
  const handleDocumentClick = (event: Event) => {
    if (!enabled || !ref.current) return;
    
    if (!ref.current.contains(event.target as Node)) {
      onClickOutside();
    }
  };

  // Attach event listener when component mounts via ref callback
  const callbackRef = useRef<T | null>(null);
  const setRef = (node: T | null) => {
    // Clean up previous listener
    if (callbackRef.current && enabled) {
      document.removeEventListener('mousedown', handleDocumentClick);
    }
    
    // Set new ref
    callbackRef.current = node;
    (ref as any).current = node;
    
    // Add new listener
    if (node && enabled) {
      document.addEventListener('mousedown', handleDocumentClick);
    }
  };

  // Return a ref with the callback
  return {
    get current() {
      return callbackRef.current;
    },
    set current(node: T | null) {
      setRef(node);
    }
  } as RefObject<T>;
};