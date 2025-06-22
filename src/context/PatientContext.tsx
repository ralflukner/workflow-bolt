import React, { useState, useEffect, ReactNode, useContext } from 'react';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { mockPatients } from '../data/mockData';
import { PatientContext } from './PatientContextDef';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { localSessionService } from '../services/localStorage/localSessionService';
import { FirebaseContext } from '../contexts/firebase';
import { useAuth0 } from '@auth0/auth0-react';
import { useFirebaseAuth } from '../services/authBridge';

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
  const { isInitialized: firebaseReady } = useContext(FirebaseContext);
  const { isAuthenticated, isLoading: auth0Loading } = useAuth0();
  const { ensureFirebaseAuth } = useFirebaseAuth();
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);
  
  // Only use Firebase if both Firebase is ready AND user is authenticated with Firebase
  const canUseFirebase = firebaseReady && isAuthenticated && !auth0Loading && firebaseAuthReady;
  const [useFirebase, setUseFirebase] = useState(canUseFirebase);
  
  // Handle Firebase authentication when Auth0 is ready
  useEffect(() => {
    const setupFirebaseAuth = async () => {
      if (isAuthenticated && !auth0Loading && firebaseReady) {
        try {
          console.log('🔐 Setting up Firebase authentication...');
          const firebaseAuthSuccess = await ensureFirebaseAuth();
          setFirebaseAuthReady(firebaseAuthSuccess);
          if (firebaseAuthSuccess) {
            console.log('✅ Firebase authentication successful');
          } else {
            console.warn('❌ Firebase authentication failed');
          }
        } catch (error) {
          console.error('🚨 Firebase authentication error:', error);
          setFirebaseAuthReady(false);
        }
      } else {
        setFirebaseAuthReady(false);
      }
    };

    setupFirebaseAuth();
  }, [isAuthenticated, auth0Loading, firebaseReady, ensureFirebaseAuth]);

  // Update useFirebase when authentication state changes
  useEffect(() => {
    setUseFirebase(canUseFirebase);
  }, [canUseFirebase]);
  const storageService = useFirebase ? dailySessionService : localSessionService;
  const storageType = useFirebase ? 'Firebase' : 'LocalStorage';

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

        console.log(`Loaded ${savedPatients.length} patients from ${storageType}`);
        setPatients(savedPatients);
        // Consider it "real data" even if empty, because it's from persistence
        // This allows users to start with an empty list and add patients
        setHasRealData(true);
      } catch (error) {
        console.error(`Failed to load from ${storageType}:`, error);

        // If Firebase fails, fall back to localStorage
        if (useFirebase && firebaseReady) {
          console.warn('Firebase load failed, falling back to localStorage');
          setUseFirebase(false);
          try {
            const savedPatients = await localSessionService.loadTodaysSession();
            console.log(`Loaded ${savedPatients.length} patients from localStorage fallback`);
            setPatients(savedPatients);
            setHasRealData(true);
          } catch (localError) {
            console.error('localStorage fallback also failed:', localError);
            setPatients([]);
            setHasRealData(false);
          }
        } else {
          setPatients([]);
          setHasRealData(false);
          if (!firebaseReady) {
            setPersistenceEnabled(false);
            console.warn('localStorage persistence disabled due to data corruption');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTodaysData();

    // Setup real-time listener for Firebase updates
    let unsubscribe: (() => void) | undefined;
    if (useFirebase && firebaseReady && !isLoading && isAuthenticated && !auth0Loading && firebaseAuthReady) {
      console.log('Setting up Firebase real-time listener');
      unsubscribe = dailySessionService.subscribeToDailySession((updatedPatients) => {
        console.log(`Real-time update: ${updatedPatients.length} patients from Firebase`);
        setPatients(updatedPatients);
        setHasRealData(true);
      });
    }

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up Firebase real-time listener');
        unsubscribe();
      }
    };
  }, [persistenceEnabled, storageService, storageType, useFirebase, firebaseReady, isLoading, isAuthenticated, auth0Loading, firebaseAuthReady]);

  // Auto-save patients data periodically and when data changes
  useEffect(() => {
    if (!persistenceEnabled || isLoading) return;

    // Skip auto-save if we have no patients at all
    if (patients.length === 0) {
      console.log('Skipping auto-save: no patients to save');
      return;
    }

    const saveSession = async () => {
      try {
        console.log(`Auto-saving ${patients.length} patients to ${storageType}...`);
        await storageService.saveTodaysSession(patients);
        console.log(`Session auto-saved to ${storageType}: ${patients.length} patients`);
      } catch (error) {
        console.error(`Failed to auto-save to ${storageType}:`, error);

        // If Firebase save fails, fall back to localStorage
        if (useFirebase && firebaseReady) {
          console.warn('Firebase save failed, falling back to localStorage');
          setUseFirebase(false);
          try {
            await localSessionService.saveTodaysSession(patients);
            console.log('Session saved to localStorage fallback');
          } catch (localError) {
            console.error('localStorage fallback save also failed:', localError);
          }
        }
      }
    };

    // Save immediately when patients change
    const timeoutId = setTimeout(saveSession, 2000); // Debounce saves by 2 seconds

    return () => clearTimeout(timeoutId);
  }, [patients, persistenceEnabled, isLoading, storageService, storageType, useFirebase, firebaseReady, isAuthenticated, auth0Loading, firebaseAuthReady]);

  // Set up an interval to force re-renders and periodic saves
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let saveCounter = 0;

    const tick = () => {
      setTickCounter(prev => prev + 1);
      saveCounter++;

      // Periodic save every 5 minutes during real time mode
      // Since tick runs every minute in real time, save every 5 ticks
      // Save if we have any patients, regardless of their source
      if (!timeMode.simulated && saveCounter >= 5 && persistenceEnabled && patients.length > 0) {
        saveCounter = 0; // Reset counter

        // Handle both sync (localStorage) and async (Firebase) saves
        const handlePeriodicSave = async () => {
          try {
            await storageService.saveTodaysSession(patients);
            console.log(`Periodic save to ${storageType} successful`);
          } catch (error) {
            console.error(`Periodic save to ${storageType} failed:`, error);

            // If Firebase fails, fall back to localStorage
            if (useFirebase && firebaseReady) {
              console.warn('Firebase periodic save failed, falling back to localStorage');
              setUseFirebase(false);
              try {
                await localSessionService.saveTodaysSession(patients);
                console.log('Periodic save to localStorage fallback successful');
              } catch (localError) {
                console.error('localStorage fallback periodic save also failed:', localError);
              }
            }
          }
        };

        // For async Firebase saves, handle the promise properly
        if (useFirebase) {
          handlePeriodicSave();
        } else {
          // localStorage is synchronous
          try {
            storageService.saveTodaysSession(patients);
            console.log(`Periodic save to ${storageType} successful`);
          } catch (error) {
            console.error(`Periodic save to ${storageType} failed:`, error);
          }
        }
      }
    };

    if (timeMode.simulated) {
      intervalId = setInterval(tick, 1000);
    } else {
      intervalId = setInterval(tick, 60000); // 1 minute for real time - update wait times every minute
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeMode.simulated, persistenceEnabled, patients, storageService, storageType, useFirebase, firebaseReady, isAuthenticated, auth0Loading, firebaseAuthReady]);

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

  const deletePatient = (id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
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
      averageWaitTime: (() => {
        // Only calculate wait time for patients who are actually waiting (have checked in but not completed)
        const waitingPatients = patients.filter(p => 
          p.checkInTime && 
          p.status !== 'completed' && 
          p.status !== 'Cancelled' && 
          p.status !== 'No Show' &&
          p.status !== 'Rescheduled' &&
          p.status !== 'scheduled'
        );
        if (waitingPatients.length === 0) return 0;
        const totalWaitTime = waitingPatients.reduce((acc, patient) => acc + getWaitTime(patient), 0);
        return totalWaitTime / waitingPatients.length;
      })(),
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

  const refreshFromFirebase = async () => {
    if (!useFirebase || !firebaseReady) {
      console.warn('Cannot refresh: Firebase not configured');
      return;
    }

    try {
      console.log('Manually refreshing patient data from Firebase');

      // Load today's patients
      const todayPatients = await dailySessionService.loadTodaysSession();
      console.log(`Found ${todayPatients.length} patients for today`);

      // Also check tomorrow's date to handle "Sync Tomorrow" functionality
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowId = tomorrow.toISOString().split('T')[0];

      try {
        const tomorrowPatients = await dailySessionService.loadSessionForDate(tomorrowId);
        console.log(`Found ${tomorrowPatients.length} patients for tomorrow (${tomorrowId})`);

        // If tomorrow has data but today doesn't, use tomorrow's data
        // This handles the "Sync Tomorrow" case where users want to see tomorrow's appointments
        if (tomorrowPatients.length > 0 && todayPatients.length === 0) {
          console.log('Using tomorrow\'s data as no data exists for today');
          setPatients(tomorrowPatients);
          setHasRealData(true);
          return;
        }
      } catch {
        console.log('No data for tomorrow, using today\'s data');
      }

      // Default to today's data
      setPatients(todayPatients);
      setHasRealData(true);
    } catch (error) {
      console.error('Failed to refresh from Firebase:', error);
    }
  };

  const value = {
    patients,
    isLoading,
    persistenceEnabled,
    hasRealData,
    tickCounter,
    clearPatients,
    addPatient,
    deletePatient,
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
    refreshFromFirebase,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
