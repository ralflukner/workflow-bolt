import React, { useState, useEffect, ReactNode } from 'react';
import { TimeMode } from '../types';
import { TimeContext } from './TimeContextDef';

const getCurrentTime = (): Date => new Date();

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
    let intervalId: number | undefined;

    const updateTime = () => {
      const now = new Date();
      setTimeMode(prev => ({
        ...prev,
        currentTime: now.toISOString(),
      }));
    };

    if (!timeMode.simulated) {
      // Update immediately
      updateTime();
      // Then set up interval for subsequent updates
      intervalId = window.setInterval(updateTime, 1000);
    }

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [timeMode.simulated]);

  const toggleSimulation = () => {
    const now = new Date();
    setTimeMode(prev => ({
      ...prev,
      simulated: !prev.simulated,
      currentTime: now.toISOString()
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