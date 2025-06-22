import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Patient } from '../types';
import { mockPatients } from '../data/mockData';
import { dailySessionService } from '../services/firebase/dailySessionService';
import { localSessionService } from '../services/localStorage/localSessionService';
import { useMemo } from 'react';

interface UsePatientDataOptions {
  persistenceEnabled: boolean;
  useFirebase: boolean;
  firebaseReady: boolean;
  isAuthenticated: boolean;
  auth0Loading: boolean;
  firebaseAuthReady: boolean;
}

export const usePatientData = (options: UsePatientDataOptions) => {
  const {
    persistenceEnabled,
    useFirebase,
    firebaseReady,
    isAuthenticated,
    auth0Loading,
    firebaseAuthReady
  } = options;

  const queryClient = useQueryClient();

  // Determine which storage service to use
  const storageService = useMemo(() => 
    useFirebase ? dailySessionService : localSessionService, 
    [useFirebase]
  );

  const storageType = useMemo(() => 
    useFirebase ? 'Firebase' : 'LocalStorage', 
    [useFirebase]
  );

  // Query for loading patient data
  const {
    data: patients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['patients', useFirebase, persistenceEnabled, storageType],
    queryFn: async (): Promise<Patient[]> => {
      if (!persistenceEnabled) {
        console.log('Using mock patients (persistence disabled)');
        return mockPatients;
      }

      try {
        console.log(`Using ${storageType} for data persistence`);
        const savedPatients = await storageService.loadTodaysSession();
        console.log(`Loaded ${savedPatients.length} patients from ${storageType}`);
        return savedPatients;
      } catch (error) {
        console.error(`Failed to load from ${storageType}:`, error);

        // If Firebase fails, fall back to localStorage
        if (useFirebase && firebaseReady) {
          console.warn('Firebase load failed, falling back to localStorage');
          try {
            const savedPatients = await localSessionService.loadTodaysSession();
            console.log(`Loaded ${savedPatients.length} patients from localStorage fallback`);
            return savedPatients;
          } catch (localError) {
            console.error('localStorage fallback also failed:', localError);
            return [];
          }
        }
        
        if (!firebaseReady && useFirebase) {
          console.warn('Firebase not ready, using mock data temporarily');
          return mockPatients;
        }
        
        return [];
      }
    },
    enabled: !auth0Loading && (isAuthenticated || !useFirebase) && (firebaseAuthReady || !useFirebase),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry if it's an authentication issue
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === 'permission-denied' || errorCode === 'unauthenticated') {
          return false;
        }
      }
      return failureCount < 2;
    }
  });

  // Mutation for saving patient data
  const savePatientsMutation = useMutation({
    mutationFn: async (patientsToSave: Patient[]) => {
      if (!persistenceEnabled || patientsToSave.length === 0) {
        console.log('Skipping auto-save: persistence disabled or no patients');
        return;
      }

      try {
        console.log(`Auto-saving ${patientsToSave.length} patients to ${storageType}...`);
        await storageService.saveTodaysSession(patientsToSave);
        console.log(`Session auto-saved to ${storageType}: ${patientsToSave.length} patients`);
      } catch (error) {
        console.error(`Failed to auto-save to ${storageType}:`, error);

        // If Firebase save fails, fall back to localStorage
        if (useFirebase && firebaseReady) {
          console.warn('Firebase save failed, falling back to localStorage');
          await localSessionService.saveTodaysSession(patientsToSave);
          console.log(`Fallback save to localStorage: ${patientsToSave.length} patients`);
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Invalidate and refetch patient data after successful save
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error) => {
      console.error('Save operation failed:', error);
    }
  });

  // Helper function to update patients in cache and save
  const updatePatients = (newPatients: Patient[]) => {
    // Optimistically update the cache
    queryClient.setQueryData(['patients', useFirebase, persistenceEnabled, storageType], newPatients);
    
    // Save to storage
    savePatientsMutation.mutate(newPatients);
  };

  // Helper function to add a patient
  const addPatient = (newPatient: Patient) => {
    const updatedPatients = [...patients, newPatient];
    updatePatients(updatedPatients);
  };

  // Helper function to update a specific patient
  const updatePatient = (patientId: string, updates: Partial<Patient>) => {
    const updatedPatients = patients.map(p => 
      p.id === patientId ? { ...p, ...updates } : p
    );
    updatePatients(updatedPatients);
  };

  // Helper function to remove a patient
  const removePatient = (patientId: string) => {
    const updatedPatients = patients.filter(p => p.id !== patientId);
    updatePatients(updatedPatients);
  };

  return {
    patients,
    isLoading,
    error,
    refetch,
    updatePatients,
    addPatient,
    updatePatient,
    removePatient,
    hasRealData: persistenceEnabled && patients.length >= 0, // Consider it real data if persistence is enabled
    storageType,
    isSaving: savePatientsMutation.isPending
  };
};