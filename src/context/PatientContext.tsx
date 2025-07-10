import React, { useState, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Patient, PatientApptStatus, Metrics } from '../types';
import { useTimeContext } from '../hooks/useTimeContext';
import { PatientContext } from './PatientContextDef';
import { useAuth0 } from '@auth0/auth0-react';
import { usePatientData } from '../hooks/usePatientData';
import { mockPatients } from '../data/mockData';
import { localSessionService } from '../services/localStorage/localSessionService';
import { debugLogger } from '../services/debugLogger';

interface PatientProviderProps {
  children: ReactNode;
}

// Helper to normalize various status spellings/capitalizations
export const normalizeStatus = (status: string): string => {
  if (!status) {
    return 'scheduled'; // Default status for invalid input
  }

  const s = status.replace(/\s+/g, ' ').trim().toLowerCase();
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
  const { isAuthenticated, isLoading: auth0Loading } = useAuth0();

  // Use React Query for patient data management
  const {
    patients,
    isLoading,
    hasRealData,
    storageType,
    updatePatients,
    addPatient: addPatientToQuery,
    updatePatient: updatePatientInQuery,
    removePatient: removePatientFromQuery
  } = usePatientData({
    persistenceEnabled,
    usePostgres: isAuthenticated && !auth0Loading,
    isAuthenticated,
    auth0Loading
  });

  // Use React Query's refetch interval for periodic updates instead of useEffect
  const { refetch: refetchPatients } = useQuery({
    queryKey: ['periodicUpdate', timeMode.simulated],
    queryFn: () => {
      setTickCounter(prev => prev + 1);
      return Promise.resolve({ timestamp: Date.now() }); // Return actual data instead of undefined
    },
    refetchInterval: timeMode.simulated ? 1000 : 60000,
    enabled: true
  });

  const clearPatients = () => {
    debugLogger.addLog(`🗑️ PatientContext: Clearing all patients`, 'PatientContext');
    updatePatients([]);
  };

  const addPatient = (patientData: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    debugLogger.addLog(`➕ PatientContext: Adding patient ${newPatient.name} (ID: ${newPatient.id})`, 'PatientContext');
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

    // Update state using React Query
    updatePatients(importedPatients);
  };

  const saveCurrentSession = async () => {
    if (!persistenceEnabled) {
      throw new Error('Persistence is disabled');
    }

    try {
      // For now, use local storage until PostgreSQL service is implemented
      await localSessionService.saveTodaysSession(patients);
      console.log(`Session saved to ${storageType}`);
    } catch (error) {
      console.error(`Failed to save to ${storageType}:`, error);
      throw error;
    }
  };

  const togglePersistence = () => {
    setPersistenceEnabled(prev => !prev);
  };

  // Use React Query mutation for refreshing from database
  const refreshFromDatabaseMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        throw new Error('Cannot refresh: Not authenticated');
      }

      console.log('Manually refreshing patient data from database');

      // TODO: Implement PostgreSQL service to load patient data
      // For now, return empty array
      return [];
    },
    onSuccess: (newPatients) => {
      updatePatients(newPatients);
      console.log('✅ Database refresh successful');
    },
    onError: (error) => {
      console.error('Failed to refresh from database:', error);
    }
  });

  const refreshFromDatabase = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      refreshFromDatabaseMutation.mutate(undefined, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  };

  const value = {
    patients,
    isLoading,
    persistenceEnabled,
    hasRealData,
    tickCounter,
    clearPatients,
    addPatient,
    updatePatients,
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
    refreshFromFirebase: refreshFromDatabase, // Keep the same interface for now
    firebaseAuthError: null, // No longer using Firebase
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};
