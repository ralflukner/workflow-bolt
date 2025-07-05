import React, { createContext } from "react";
export interface PatientContextType {
  selectedPatient: any;
  setSelectedPatient: (patient: any) => void;
}
export default createContext<PatientContextType | undefined>(undefined);
