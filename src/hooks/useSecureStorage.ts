import React, { useState, useCallback } from 'react';

interface SecureStorageOptions<T> {
  key: string;
  defaultValue: T;
  storageType: 'session' | 'memory';
}

export const useSecureStorage = <T>({ key, defaultValue, storageType }: SecureStorageOptions<T>) => {
  const [value, setValue] = useState(() => {
    try {
      const item = storageType === 'session' 
        ? sessionStorage.getItem(key)
        : null;
      return item ? JSON.parse(item) : defaultValue;
    } catch (error: unknown) {
      console.error('Error reading from storage:', error);
      return defaultValue;
    }
  });

  // Replace useEffect with callback-based storage sync
  const setValueWithStorage = useCallback((newValue: React.SetStateAction<T>) => {
    setValue(prevValue => {
      const actualNewValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prevValue) 
        : newValue;
      
      // Sync to storage immediately
      try {
        if (storageType === 'session') {
          sessionStorage.setItem(key, JSON.stringify(actualNewValue));
        }
      } catch (error: unknown) {
        console.error('Error saving to storage:', error);
      }
      
      return actualNewValue;
    });
  }, [key, storageType]);

  return [value, setValueWithStorage] as [T, React.Dispatch<React.SetStateAction<T>>];
};
