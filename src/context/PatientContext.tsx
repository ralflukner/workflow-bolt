import React, { useState, useEffect, ReactNode } from 'react';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { mockPatients } from '../data/mockData';
import { PatientContext } from './PatientContextDef';
// TODO: Uncomment when implementing Firebase persistence
// import { patientService } from '../services/firebase/patientService';

interface PatientProviderProps {
  children: ReactNode;
}

// Helper to normalize various status spellings/capitalizations
const normalizeStatus = (status: string): string => {
  if (!status) {
    return 'scheduled'; // Default status for invalid input
  }

  const s = status.trim().toLowerCase();
  switch (s) {
    case 'checkedout':
    case 'checked-out':
    case 'checked out':
    case 'checked_out':
      return 'completed';
    case 'checked in':
    case 'check-in':
    case 'checkedin':
      return 'arrived';
    case 'roomed':
      return 'appt-prep';
    case 'withdoctor':
    case 'with doctor':
      return 'With Doctor';
    case 'scheduled':
      return 'scheduled';
    case 'arrived':
      return 'arrived';
    case 'appt prep started':
      return 'appt-prep';
    case 'ready for md':
      return 'ready-for-md';
    case 'seen by md':
      return 'seen-by-md';
    case 'rescheduled':
      return 'rescheduled';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'no show':
    case 'noshow':
      return 'no-show';
    default:
      return status;
  }
};

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [tickCounter, setTickCounter] = useState(0); // Add a tick counter state
  const { getCurrentTime, timeMode } = useTimeContext();

  // Set up an interval to force re-renders based on the time mode.
  // This ensures consumers get updated context values periodically.
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      // Force re-render by incrementing the tick counter
      setTickCounter(prev => prev + 1);
    };

    if (timeMode.simulated) {
      // For simulated time, update very frequently
      intervalId = setInterval(tick, 1000); // Update every second
    } else {
      // For real time, update less frequently (every 6 seconds)
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

          // Normalize status variations to handle timestamps consistently
          updatedPatient.status = normalizeStatus(status) as PatientApptStatus;

          // Arrival/check-in timestamps
          if (
            updatedPatient.status === 'arrived' ||
            updatedPatient.status === 'Arrived' ||
            updatedPatient.status === 'Checked In'
          ) {
            updatedPatient.checkInTime = updatedPatient.checkInTime || now;
          }

          // With-doctor timestamps
          if (
            updatedPatient.status === 'With Doctor' ||
            updatedPatient.status === 'seen-by-md' ||
            updatedPatient.status === 'Seen by MD'
          ) {
            updatedPatient.withDoctorTime = updatedPatient.withDoctorTime || now;
          }

          // Completion timestamps
          if (updatedPatient.status === 'completed' || updatedPatient.status === 'Checked Out') {
            updatedPatient.completedTime = updatedPatient.completedTime || now;
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

  const exportPatientsToJSON = () => {
    const jsonData = JSON.stringify(patients, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importPatientsFromJSON = (importedPatients: Patient[]) => {
     // Basic validation
     if (!Array.isArray(importedPatients)) {
       throw new Error('Invalid data format: expected array of patients');
     }

     // Normalize statuses and ensure timestamps
     const normalized = importedPatients.map(p => {
       const updated = { ...p };
       const normalizedStatus = normalizeStatus(updated.status as string);
       updated.status = normalizedStatus as PatientApptStatus;

       const now = new Date().toISOString();

       // Set timestamps based on normalized status
       if (['arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'].includes(normalizedStatus)) {
         updated.checkInTime = updated.checkInTime || now;
       }

       if (['With Doctor', 'seen-by-md', 'completed'].includes(normalizedStatus)) {
         updated.withDoctorTime = updated.withDoctorTime || now;
       }

       if (normalizedStatus === 'completed') {
         updated.completedTime = updated.completedTime || now;
       }

       return updated;
     });

     // Validate each patient has required fields
     const requiredFields = ['id', 'name', 'dob', 'appointmentTime', 'provider', 'status'];
     normalized.forEach((patient, index) => {
       requiredFields.forEach(field => {
         if (!(field in patient)) {
           throw new Error(`Patient at index ${index} missing required field: ${field}`);
         }
       });
     });

     setPatients(normalized);
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
    exportPatientsToJSON,
    importPatientsFromJSON,
    tickCounter, // Include the tick counter in the context value
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
