import React, { useState, useEffect, ReactNode } from 'react';
import TimeContext, { TimeContextType } from './TimeContext';

interface TimeProviderProps {
  children: ReactNode;
}

export const TimeProvider: React.FC<TimeProviderProps> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeMode, setTimeMode] = useState<{ simulated: boolean; speed: number }>({
    simulated: false,
    speed: 1
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeMode.simulated) {
      interval = setInterval(() => {
        setCurrentTime(prev => new Date(prev.getTime() + (60000 * timeMode.speed)));
      }, 1000);
    } else {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timeMode.simulated, timeMode.speed]);

  const getCurrentTime = (): Date => {
    return currentTime;
  };

  const toggleTimeMode = (): void => {
    setTimeMode(prev => ({
      ...prev,
      simulated: !prev.simulated
    }));
  };

  const setTimeSpeed = (speed: number): void => {
    setTimeMode(prev => ({
      ...prev,
      speed
    }));
  };

  const toggleSimulation = (): void => {
    toggleTimeMode();
  };

  const adjustTime = (minutes: number, newTime?: Date): void => {
    if (newTime) {
      setCurrentTime(newTime);
    } else {
      setCurrentTime(prev => new Date(prev.getTime() + (minutes * 60000)));
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const contextValue: TimeContextType = {
    currentTime,
    timeMode: {
      ...timeMode,
      currentTime: currentTime.toISOString()
    },
    getCurrentTime,
    setCurrentTime,
    toggleTimeMode,
    setTimeSpeed,
    toggleSimulation,
    adjustTime,
    formatTime,
    formatDateTime
  };

  return (
    <TimeContext.Provider value={contextValue}>
      {children}
    </TimeContext.Provider>
  );
};

export default TimeProvider;