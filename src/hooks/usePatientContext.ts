import { useContext } from 'react';
import { PatientContext } from '../context/PatientContextDef';

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    console.error('usePatientContext called outside of PatientProvider');
    console.trace(); // This will show you where it's being called from
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};