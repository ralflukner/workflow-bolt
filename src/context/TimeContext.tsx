import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { TimeMode } from '../types';
// Remove Timer import since we're using native setInterval

const getCurrentTime = (): Date => new Date();

interface TimeContextType {
  timeMode: TimeMode;
  toggleSimulation: () => void;
  adjustTime: (minutesToAdd: number, newTime?: Date) => void;
  getCurrentTime: () => Date;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
}

export const TimeContext = createContext<TimeContextType | undefined>(undefined);

interface TimeProviderProps {
  children: ReactNode;
}

// Remove this interface since it's imported from types

export const TimeProvider: React.FC<TimeProviderProps> = ({ children }) => {
  const [timeMode, setTimeMode] = useState<TimeMode>({
    simulated: false,
    currentTime: getCurrentTime().toISOString(),
  });

  // Update real time every second
  useEffect(() => {
    let intervalId: number | undefined;

    const updateTime = () => {
      setTimeMode(prev => ({
        ...prev,
        currentTime: new Date().toISOString(),
      }));
    };

    if (!timeMode.simulated) {
      updateTime();
      intervalId = window.setInterval(updateTime, 1000);
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [timeMode.simulated]);

  const toggleSimulation = () => {
    setTimeMode(prev => ({
      ...prev,
      simulated: !prev.simulated,
      currentTime: new Date().toISOString()
    }));
  };

  const adjustTime = (minutesToAdd: number, newTime?: Date) => {
    if (timeMode.simulated) {
      let adjustedTime: Date;
      if (newTime) {
        adjustedTime = new Date(newTime);
      } else {
        adjustedTime = new Date(timeMode.currentTime);
        adjustedTime.setMinutes(adjustedTime.getMinutes() + minutesToAdd);
      }

      setTimeMode(prev => ({
        ...prev,
        currentTime: adjustedTime.toISOString(),
      }));
    }
  };

  const getCurrentDisplayTime = (): Date => {
    return new Date(timeMode.currentTime);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Chicago'
    });
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString([], {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago'
    }) + ' ' + formatTime(date);
  };

  const value = {
    timeMode,
    toggleSimulation,
    adjustTime,
    getCurrentTime: getCurrentDisplayTime,
    formatTime,
    formatDateTime,
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
};
