import { createContext } from 'react';
import { TimeMode } from '../types';

// Define the context type
interface TimeContextType {
  timeMode: TimeMode;
  toggleSimulation: () => void;
  adjustTime: (minutesToAdd: number, newTime?: Date) => void;
  getCurrentTime: () => Date;
  formatTime: (date: Date) => string;
  formatDateTime: (date: Date) => string;
}

// Create the context with undefined as default value
export const TimeContext = createContext<TimeContextType | undefined>(undefined);