import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    try {
      if (storageType === 'session') {
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error: unknown) {
      console.error('Error saving to storage:', error);
    }
  }, [key, value, storageType]);

  return [value, setValue] as [T, React.Dispatch<React.SetStateAction<T>>];
};
