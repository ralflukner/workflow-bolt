import React, { createContext } from 'react';

export interface TimeContextType {
  currentTime: Date;
  timeMode: { simulated: boolean; speed: number; currentTime: string };
  getCurrentTime: () => Date;
  setCurrentTime: (time: Date) => void;
  toggleTimeMode: () => void;
  setTimeSpeed: (speed: number) => void;
  toggleSimulation: () => void;
  adjustTime: (minutes: number, newTime?: Date) => void;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);
export default TimeContext;
export { TimeContext };
