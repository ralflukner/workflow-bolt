import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { mockPatients } from '../data/mockData';

interface PatientContextType {
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  updatePatientStatus: (id: string, status: PatientApptStatus) => void;
  assignRoom: (id: string, room: string) => void;
  updateCheckInTime: (id: string, checkInTime: string) => void;
  getPatientsByStatus: (status: PatientApptStatus) => Patient[];
  getMetrics: () => Metrics;
  getWaitTime: (patient: Patient) => number;
  clearPatients: () => void;
}

export const PatientContext = createContext<PatientContextType | undefined>(undefined);

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const { getCurrentTime, timeMode } = useTimeContext();

  // Set up an interval to force re-renders based on the time mode.
  // This ensures consumers get updated context values periodically.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      // Force re-render of the context provider
      setPatients(prev => [...prev]);
    };

    if (timeMode.simulated) {
      // For simulated time, update very frequently
      intervalId = setInterval(tick, 1000); // Update every second
    } else {
      // For real time, update less frequently
      intervalId = setInterval(tick, 6000); // Update every 6 seconds
    }

    // Cleanup interval on mode change or unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeMode.simulated, timeMode.currentTime]); // Depend on both simulation mode and current time

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

  const updatePatientStatus = (id: string, status: PatientApptStatus) => {
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
            case 'With Doctor':
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

  const updateCheckInTime = (id: string, checkInTime: string) => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === id ? { ...patient, checkInTime } : patient
      )
    );
  };

  const getPatientsByStatus = (status: PatientApptStatus): Patient[] => {
    return patients.filter(patient => patient.status === status);
  };

  // Calculate wait time in minutes
  const getWaitTime = (patient: Patient): number => {
    if (!patient.checkInTime) return 0;

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
    // Include only patients who have been checked in, preparation started, or completed (MD Ready)
    // Exclude scheduled, confirmed, MD Seen, and Checked out statuses
    const waitingPatients = patients.filter(p => 
      ['arrived', 'appt-prep', 'ready-for-md'].includes(p.status as string)
    );
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
    updateCheckInTime,
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
