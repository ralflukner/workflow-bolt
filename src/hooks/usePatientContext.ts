import { useContext } from 'react';
import { PatientContext } from '../context/PatientContextDef';

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};