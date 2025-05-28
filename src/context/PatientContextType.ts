import { Patient, PatientApptStatus, Metrics } from '../types';

export interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatientStatus: (id: string, status: PatientApptStatus) => void;
  assignRoom: (id: string, room: string) => void;
  updateCheckInTime: (id: string, checkInTime: string) => void;
  getPatientsByStatus: (status: PatientApptStatus) => Patient[];
  getMetrics: () => Metrics;
  getWaitTime: (patient: Patient) => number;
  clearPatients: () => void;
  exportPatientsToJSON: () => void;
  importPatientsFromJSON: (patients: Patient[]) => void;
} 