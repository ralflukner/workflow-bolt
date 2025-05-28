import { createContext } from 'react';
import { PatientContextType } from './PatientContextType';

// Create the context in a separate file to avoid Fast Refresh issues
export const PatientContext = createContext<PatientContextType | undefined>(undefined);