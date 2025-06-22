import React, { useState, useEffect, ReactNode, useContext } from 'react';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { PatientContext } from './PatientContextDef';
import { FirebaseContext } from '../contexts/firebase';
import { useAuth0 } from '@auth0/auth0-react';
import { useFirebaseAuth } from '../services/authBridge';
import { usePatientData } from '../hooks/usePatientData';

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
  const [tickCounter, setTickCounter] = useState(0);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);
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

  // Use React Query for patient data management
  const {
    patients,
    isLoading,
    hasRealData,
    storageType,
    updatePatients,
    addPatient: addPatientToQuery,
    updatePatient: updatePatientInQuery,
    removePatient: removePatientFromQuery,
    isSaving
  } = usePatientData({
    persistenceEnabled,
    useFirebase,
    firebaseReady,
    isAuthenticated,
    auth0Loading,
    firebaseAuthReady
  });



  // Set up an interval to force re-renders and periodic saves
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      setTickCounter(prev => prev + 1);
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
  }, [timeMode.simulated]);

  const clearPatients = () => {
    updatePatients([]);
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    addPatientToQuery(newPatient);
  };

  const deletePatient = (id: string) => {
    removePatientFromQuery(id);
  };

  // Load mock data manually (for development/testing)
  const loadMockData = () => {
    updatePatients(mockPatients);
    console.log('Mock data loaded for development/testing');
  };

  const updatePatientStatus = (id: string, status: PatientApptStatus) => {
    const now = getCurrentTime().toISOString();
    const patient = patients.find(p => p.id === id);
    
    if (!patient) return;

    const updatedData: Partial<Patient> = { 
      status: normalizeStatus(status) as PatientApptStatus 
    };

    if (
      updatedData.status === 'arrived' ||
      updatedData.status === 'Arrived' ||
      updatedData.status === 'Checked In'
    ) {
      updatedData.checkInTime = patient.checkInTime || now;
    }

    if (
      updatedData.status === 'With Doctor' ||
      updatedData.status === 'seen-by-md' ||
      updatedData.status === 'Seen by MD'
    ) {
      updatedData.withDoctorTime = patient.withDoctorTime || now;
    }

    if (updatedData.status === 'completed' || updatedData.status === 'Checked Out') {
      updatedData.completedTime = patient.completedTime || now;
    }

    updatePatientInQuery(id, updatedData);
  };

  const assignRoom = (id: string, room: string) => {
    updatePatientInQuery(id, { room });
  };

  const updateCheckInTime = (id: string, checkInTime: string) => {
    updatePatientInQuery(id, { checkInTime });
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
