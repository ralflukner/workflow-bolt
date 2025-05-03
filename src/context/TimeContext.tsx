import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { TimeMode } from '../types';

const getCurrentTime = (): Date => new Date();

interface TimeContextType {
  timeMode: TimeMode;
  toggleSimulation: () => void;
  adjustTime: (minutesToAdd: number, newTime?: Date) => void;
  getCurrentTime: () => Date;
  formatTime: (date: Date) => string;
}

export const TimeContext = createContext<TimeContextType | undefined>(undefined);

interface TimeProviderProps {
  children: ReactNode;
}

export const TimeProvider: React.FC<TimeProviderProps> = ({ children }) => {
  const [timeMode, setTimeMode] = useState<TimeMode>({
    simulated: false,
    currentTime: getCurrentTime().toISOString(),
  });

  // Update real time every second
  useEffect(() => {
    if (!timeMode.simulated) {
      const interval = setInterval(() => {
        setTimeMode(prev => ({
          ...prev,
          currentTime: getCurrentTime().toISOString(),
        }));
      }, 1000); // Update every second

      return () => clearInterval(interval);
    }
  }, [timeMode.simulated]);

  const toggleSimulation = () => {
    setTimeMode(prev => ({
      ...prev,
      simulated: !prev.simulated,
      currentTime: getCurrentTime().toISOString()
    }));
  };

  const adjustTime = (minutesToAdd: number, newTime?: Date) => {
    if (timeMode.simulated) {
      let adjustedTime: Date;
      if (newTime) {
        adjustedTime = newTime;
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
    // Always use the stored time from state to ensure consistency
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

  const value = {
    timeMode,
    toggleSimulation,
    adjustTime,
    getCurrentTime: getCurrentDisplayTime,
    formatTime,
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
};
