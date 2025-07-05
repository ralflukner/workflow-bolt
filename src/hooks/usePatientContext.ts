import { useContext } from 'react';
import PatientContext from '../contexts/PatientContext';

export function usePatientContext() {
  const context = useContext(PatientContext);
  
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  
  return context;
}
