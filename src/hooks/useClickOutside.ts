import { useRef, RefObject, useEffect, useCallback } from 'react';

interface UseClickOutsideOptions {
  onClickOutside: () => void;
  enabled?: boolean;
}

/**
 * Custom hook for handling click outside events
 * Simplified to use useEffect for proper cleanup
 */
export const useClickOutside = <T extends HTMLElement>({ 
  onClickOutside, 
  enabled = true 
}: UseClickOutsideOptions): RefObject<T> => {
  const ref = useRef<T>(null);

  const handleDocumentClick = useCallback((event: Event) => {
    if (!enabled || !ref.current) return;
    
    if (!ref.current.contains(event.target as Node)) {
      onClickOutside();
    }
  }, [enabled, onClickOutside]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('mousedown', handleDocumentClick);
      return () => {
        document.removeEventListener('mousedown', handleDocumentClick);
      };
    }
  }, [enabled, handleDocumentClick]);

  return ref;
};