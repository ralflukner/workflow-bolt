import React, { useState, useEffect, ReactNode } from 'react';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { mockPatients } from '../data/mockData';
import { PatientContext } from './PatientContextDef';
import { dailySessionService } from '../services/firebase/dailySessionService';

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
      return 'Rescheduled';
    case 'cancelled':
    case 'canceled':
      return 'Cancelled';
    case 'no show':
    case 'noshow':
      return 'No Show';
    default:
      return status;
  }
};

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tickCounter, setTickCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);
  const { getCurrentTime, timeMode } = useTimeContext();

  // Load today's session data on mount
  useEffect(() => {
    const loadTodaysData = async () => {
      if (!persistenceEnabled) {
        setPatients(mockPatients);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const savedPatients = await dailySessionService.loadTodaysSession();
        
        if (savedPatients.length > 0) {
          console.log(`Loaded ${savedPatients.length} patients from today's session`);
          setPatients(savedPatients);
        } else {
          console.log('No saved session found, starting with mock data');
          setPatients(mockPatients);
          // Save initial mock data
          await dailySessionService.saveTodaysSession(mockPatients);
        }
      } catch (error) {
        console.error('Failed to load today\'s session, using mock data:', error);
        setPatients(mockPatients);
        setPersistenceEnabled(false); // Disable persistence if it fails
      } finally {
        setIsLoading(false);
      }
    };

    loadTodaysData();
  }, [persistenceEnabled]);

  // Auto-save patients data periodically and when data changes
  useEffect(() => {
    if (!persistenceEnabled || isLoading || patients.length === 0) return;

    const saveSession = async () => {
      try {
        await dailySessionService.saveTodaysSession(patients);
        console.log('Session auto-saved successfully');
      } catch (error) {
        console.error('Failed to auto-save session:', error);
      }
    };

    // Save immediately when patients change
    const timeoutId = setTimeout(saveSession, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(timeoutId);
  }, [patients, persistenceEnabled, isLoading]);

  // Set up an interval to force re-renders and periodic saves
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      setTickCounter(prev => prev + 1);
      
      // Periodic save every 5 minutes during real time mode
      if (!timeMode.simulated && persistenceEnabled && patients.length > 0) {
        dailySessionService.saveTodaysSession(patients).catch(error => {
          console.error('Periodic save failed:', error);
        });
      }
    };

    if (timeMode.simulated) {
      intervalId = setInterval(tick, 1000);
    } else {
      intervalId = setInterval(tick, 300000); // 5 minutes for real time
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeMode.simulated, timeMode.currentTime, persistenceEnabled, patients]);

  const clearPatients = () => {
    setPatients([]);
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setPatients(prev => [...prev, newPatient]);
  };

  const updatePatientStatus = (id: string, status: PatientApptStatus) => {
    const now = getCurrentTime().toISOString();

    setPatients(prev => 
      prev.map(patient => {
        if (patient.id === id) {
          const updatedPatient = { ...patient, status };

          updatedPatient.status = normalizeStatus(status) as PatientApptStatus;

          if (
            updatedPatient.status === 'arrived' ||
            updatedPatient.status === 'Arrived' ||
            updatedPatient.status === 'Checked In'
          ) {
            updatedPatient.checkInTime = updatedPatient.checkInTime || now;
          }

          if (
            updatedPatient.status === 'With Doctor' ||
            updatedPatient.status === 'seen-by-md' ||
            updatedPatient.status === 'Seen by MD'
          ) {
            updatedPatient.withDoctorTime = updatedPatient.withDoctorTime || now;
          }

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

  const getWaitTime = (patient: Patient): number => {
    if (!patient.checkInTime) return 0;

    const checkInTime = new Date(patient.checkInTime);
    const endTime = patient.withDoctorTime 
      ? new Date(patient.withDoctorTime)
      : getCurrentTime();

    const waitTimeMs = endTime.valueOf() - checkInTime.valueOf();
    return Math.max(0, Math.floor(waitTimeMs / 60000));
  };

  const getMetrics = (): Metrics => {
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
     if (!Array.isArray(importedPatients)) {
       throw new Error('Invalid data format: expected array of patients');
     }

     const normalized = importedPatients.map(p => {
       const updated = { ...p };
       const normalizedStatus = normalizeStatus(updated.status as string);
       updated.status = normalizedStatus as PatientApptStatus;

       const now = new Date().toISOString();

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

  // Force save current session (manual trigger)
  const saveCurrentSession = async () => {
    if (!persistenceEnabled) return;
    
    try {
      await dailySessionService.saveTodaysSession(patients);
      console.log('Session saved manually');
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    }
  };

  // Toggle persistence (for testing/debugging)
  const togglePersistence = () => {
    setPersistenceEnabled(prev => !prev);
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
    tickCounter,
    isLoading,
    persistenceEnabled,
    saveCurrentSession,
    togglePersistence,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
