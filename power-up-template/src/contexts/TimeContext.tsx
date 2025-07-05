import React, { createContext } from "react";
export interface TimeContextType {
  selectedTime: any;
  setSelectedTime: (time: any) => void;
}
export default createContext<TimeContextType | undefined>(undefined);
