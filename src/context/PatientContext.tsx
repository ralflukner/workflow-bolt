import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Patient, PatientStatus, Metrics } from '../types';
import { useTimeContext } from './TimeContext';
import { mockPatients } from '../data/mockData';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatientStatus: (id: string, status: PatientStatus) => void;
  assignRoom: (id: string, room: string) => void;
  getPatientsByStatus: (status: PatientStatus) => Patient[];
  getMetrics: () => Metrics;
  getWaitTime: (patient: Patient) => number;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const { getCurrentTime, timeMode } = useTimeContext();

  // Force re-render when simulated time changes
  useEffect(() => {
    if (timeMode.simulated) {
      const currentTime = getCurrentTime().toISOString();
      setPatients(prev => [...prev]);
    }
  }, [timeMode.currentTime, timeMode.simulated]);

  const clearPatients = () => {
    setPatients([]);
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Ensure uniqueness
    };
    
    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatientStatus = (id: string, status: PatientStatus) => {
    const now = getCurrentTime().toISOString();
    
    setPatients(prev => 
      prev.map(patient => {
        if (patient.id === id) {
          const updatedPatient = { ...patient, status };
          
          // Add timestamps based on status
          switch (status) {
            case 'arrived':
              updatedPatient.checkInTime = now;
              break;
            case 'with-doctor':
              updatedPatient.withDoctorTime = now;
              break;
            case 'completed':
              updatedPatient.completedTime = now;
              break;
            default:
              break;
          }
          
          return updatedPatient;
        }
        return patient;
      })
    );
  };

  const assignRoom = (id: string, room: string) => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === id ? { ...patient, room } : patient
      )
    );
  };

  const getPatientsByStatus = (status: PatientStatus): Patient[] => {
    return patients.filter(patient => patient.status === status);
  };

  // Calculate wait time in minutes
  const getWaitTime = (patient: Patient): number => {
    if (!patient.checkInTime) return 0;

    const currentTime = new Date();
    const checkInTime = new Date(patient.checkInTime);
    const endTime = patient.withDoctorTime 
      ? new Date(patient.withDoctorTime) 
      : getCurrentTime();

    // Calculate wait time in milliseconds
    const waitTimeMs = endTime.valueOf() - checkInTime.valueOf();

    // Convert to minutes and ensure non-negative
    return Math.max(0, Math.floor(waitTimeMs / 60000));
  };

  const getMetrics = (): Metrics => {
    const waitingPatients = patients.filter(p => p.status === 'arrived');
    const waitTimes = waitingPatients.map(getWaitTime);
    
    const averageWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((acc, time) => acc + time, 0) / waitTimes.length
      : 0;
    
    const maxWaitTime = waitTimes.length > 0
      ? Math.max(...waitTimes)
      : 0;
    
    return {
      totalAppointments: patients.length,
      waitingCount: waitingPatients.length,
      averageWaitTime,
      maxWaitTime,
    };
  };

  const value = {
    patients,
    addPatient,
    updatePatientStatus,
    assignRoom,
    getPatientsByStatus,
    getMetrics,
    getWaitTime,
    clearPatients,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};