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
  const firebaseReady = isFirebaseConfigured();
  const storageService = firebaseReady ? dailySessionService : localSessionService;
  const storageType = firebaseReady ? 'Firebase' : 'LocalStorage';

  // Load today's data on mount and when persistence is toggled
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
    const checkIn = new Date(patient.checkInTime).getTime();
    const now = getCurrentTime().getTime();
    return Math.max(0, Math.floor((now - checkIn) / 1000 / 60)); // Convert to minutes
  };

  const getMetrics = (): Metrics => {
    const now = getCurrentTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return {
      totalPatients: patients.length,
      patientsByStatus: {
        scheduled: getPatientsByStatus('scheduled').length,
        arrived: getPatientsByStatus('arrived').length,
        'appt-prep': getPatientsByStatus('appt-prep').length,
        'ready-for-md': getPatientsByStatus('ready-for-md').length,
        'With Doctor': getPatientsByStatus('With Doctor').length,
        'seen-by-md': getPatientsByStatus('seen-by-md').length,
        completed: getPatientsByStatus('completed').length,
        Cancelled: getPatientsByStatus('Cancelled').length,
        'No Show': getPatientsByStatus('No Show').length,
        Rescheduled: getPatientsByStatus('Rescheduled').length,
      },
      averageWaitTime: patients.reduce((acc, patient) => acc + getWaitTime(patient), 0) / patients.length || 0,
      patientsSeenToday: patients.filter(p => p.completedTime && new Date(p.completedTime) >= today).length,
    };
  };

  const exportPatientsToJSON = () => {
    const dataStr = JSON.stringify(patients, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `patients-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPatientsFromJSON = (importedPatients: Patient[]) => {
    // Validate imported data
    if (!Array.isArray(importedPatients)) {
      throw new Error('Invalid import data: must be an array of patients');
    }

    // Validate each patient
    importedPatients.forEach((patient, index) => {
      if (!patient.id || !patient.name || !patient.status) {
        throw new Error(`Invalid patient at index ${index}: missing required fields`);
      }
    });

    // Update state
    setPatients(importedPatients);
    setHasRealData(true);
  };

  const saveCurrentSession = async () => {
    if (!persistenceEnabled) {
      throw new Error('Persistence is disabled');
    }

    try {
      await storageService.saveTodaysSession(patients);
      console.log(`Session saved to ${storageType}`);
    } catch (error) {
      console.error(`Failed to save to ${storageType}:`, error);
      throw error;
    }
  };

  const togglePersistence = () => {
    setPersistenceEnabled(prev => !prev);
  };

  const value = {
    patients,
    isLoading,
    persistenceEnabled,
    hasRealData,
    tickCounter,
    clearPatients,
    addPatient,
    loadMockData,
    updatePatientStatus,
    assignRoom,
    updateCheckInTime,
    getPatientsByStatus,
    getWaitTime,
    getMetrics,
    exportPatientsToJSON,
    importPatientsFromJSON,
    saveCurrentSession,
    togglePersistence,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
