import React, { useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Use React Query for real-time updates instead of useEffect
  useQuery({
    queryKey: ['currentTime', timeMode.simulated],
    queryFn: () => {
      if (!timeMode.simulated) {
        const now = new Date();
        setTimeMode(prev => ({
          ...prev,
          currentTime: now.toISOString(),
        }));
      }
      return Promise.resolve();
    },
    refetchInterval: timeMode.simulated ? false : 1000,
    enabled: true
  });

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
    // Format time without timezone conversion to avoid time shift issues
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatDateTime = (date: Date): string => {
    // Format date and time without timezone conversion to avoid date/time shift issues
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}/${day}/${year} ${formatTime(date)}`;
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