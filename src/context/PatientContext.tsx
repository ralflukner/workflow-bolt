import React, { useState, useEffect, ReactNode } from 'react';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { mockPatients } from '../data/mockData';
import { PatientContext } from './PatientContextDef';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { localSessionService } from '../services/localStorage/localSessionService';
import { isFirebaseConfigured } from '../config/firebase';

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
  const [hasRealData, setHasRealData] = useState(false);
  const { getCurrentTime, timeMode } = useTimeContext();

  // Determine which storage service to use
  const storageService = isFirebaseConfigured() ? dailySessionService : localSessionService;
  const storageType = isFirebaseConfigured() ? 'Firebase' : 'LocalStorage';

  // Load today's session data on mount
  useEffect(() => {
    const loadTodaysData = async () => {
      if (!persistenceEnabled) {
        setPatients(mockPatients);
        setHasRealData(false);
        setIsLoading(false);
        return;
      }

try {
         setIsLoading(true);
         console.log(`Using ${storageType} for data persistence`);
         const savedPatients = await storageService.loadTodaysSession();
         
         if (savedPatients.length > 0) {
           console.log(`Loaded ${savedPatients.length} patients from ${storageType}`);
           setPatients(savedPatients);
           setHasRealData(true);
         } else {
           console.log(`No saved session found in ${storageType}, starting with empty patient list`);
           setPatients([]);
           setHasRealData(false);
         }
       } catch (error) {
         console.error(`Failed to load from ${storageType}, starting with empty list:`, error);
         setPatients([]);
         setHasRealData(false);
        
        // Only disable persistence for localStorage errors, not Firebase network issues
        if (!isFirebaseConfigured()) {
          setPersistenceEnabled(false);
          console.warn('localStorage persistence disabled due to data corruption');
        } else {
          console.warn('Firebase load failed, but persistence remains enabled for retry');
        }
       } finally {
        setIsLoading(false);
      }
    };

    loadTodaysData();
  }, [persistenceEnabled, storageService, storageType]);

  // Auto-save patients data periodically and when data changes
  useEffect(() => {
    if (!persistenceEnabled || isLoading || !hasRealData) return;

    const saveSession = async () => {
      try {
        await storageService.saveTodaysSession(patients);
        console.log(`Session auto-saved to ${storageType}`);
      } catch (error) {
        console.error(`Failed to auto-save to ${storageType}:`, error);
      }
    };

    // Save immediately when patients change
    const timeoutId = setTimeout(saveSession, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(timeoutId);
  }, [patients, persistenceEnabled, isLoading, hasRealData, storageService, storageType]);

  // Set up an interval to force re-renders and periodic saves
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      setTickCounter(prev => prev + 1);
      
      // Periodic save every 5 minutes during real time mode (only real data)
      if (!timeMode.simulated && persistenceEnabled && patients.length > 0 && hasRealData) {
        const saveResult = storageService.saveTodaysSession(patients);
        
        // Handle both sync (localStorage) and async (Firebase) saves
        try {
          if (isFirebaseConfigured()) {
            // Firebase service returns a Promise
            (saveResult as Promise<void>).catch((error: unknown) => {
              console.error(`Periodic save to ${storageType} failed:`, error);
            });
          }
          // localStorage service returns void - no additional handling needed
        } catch (error) {
          console.error(`Periodic save to ${storageType} failed:`, error);
        }
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
  }, [timeMode.simulated, persistenceEnabled, patients, hasRealData, storageService, storageType]);

  const clearPatients = () => {
    setPatients([]);
    setHasRealData(false);
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    setPatients(prev => [...prev, newPatient]);
    setHasRealData(true); // Mark as real data when user adds patients
  };

  // Load mock data manually (for development/testing)
  const loadMockData = () => {
    setPatients(mockPatients);
    setHasRealData(false); // This is mock data, don't auto-save it
    console.log('Mock data loaded for development/testing');
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

  // Import patients and mark as real data
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
     setHasRealData(true); // Imported data is real data
   };

  // Force save current session (manual trigger)
const saveCurrentSession = async () => {
   if (!persistenceEnabled) return;
   
   try {
    await storageService.saveTodaysSession(patients);
     // Only mark as real data if we have actual patient data
     if (patients.length > 0) {
       setHasRealData(true);
     }
    console.log(`Session saved manually to ${storageType}`);
   } catch (error) {
    console.error(`Manual save to ${storageType} failed:`, error);
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
    hasRealData,
    loadMockData,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
