import React, { createContext } from 'react';

import { Patient, PatientApptStatus, AppointmentType } from '../types';

export interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Patient | Omit<Patient, 'id'>) => void;
  updatePatient: (updatedPatient: Patient) => void;
  updatePatients: (updatedPatients: Patient[]) => void;
  deletePatient: (id: string) => void;
  getPatientById: (id: string) => Patient | undefined;
  getPatientsByStatus: (status: string | string[]) => Patient[];
  getWaitTime: (patient: Patient) => number;
  calculateAverageWaitTime: () => number;
  calculateMaxWaitTime: () => number;
  importPatients: (newPatients: Patient[]) => void;
  importPatientsFromJSON: (jsonData: Patient[]) => void;
  exportPatientsToJSON: () => void;
  clearAllPatients: () => void;
  setPatientStatus: (patientId: string, newStatus: PatientApptStatus) => void;
  setPatientRoom: (patientId: string, newRoom: string) => void;
  setPatientCheckInTime: (patientId: string, checkInTime: Date) => void;
  setPatientAppointmentTime: (patientId: string, appointmentTime: Date) => void;
  setPatientChiefComplaint: (patientId: string, chiefComplaint: string) => void;
  setPatientAppointmentType: (patientId: string, appointmentType: AppointmentType) => void;
  setPatientDOB: (patientId: string, dob: Date) => void;
  setPatientName: (patientId: string, name: string) => void;
  persistenceEnabled: boolean;
  hasRealData: boolean;
  isLoading: boolean;
  tickCounter: number;
  togglePersistence: () => void;
  saveCurrentSession: () => Promise<void>;
  loadMockData: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);
export default PatientContext;
export { PatientContext };
