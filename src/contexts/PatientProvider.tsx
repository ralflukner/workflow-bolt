import React, { useState, useCallback, ReactNode } from 'react';
import PatientContext, { PatientContextType } from './PatientContext';
import { Patient, PatientApptStatus, AppointmentType } from '../types';

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider: React.FC<PatientProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [persistenceEnabled, setPersistenceEnabled] = useState<boolean>(true);
  const [hasRealData, setHasRealData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tickCounter, setTickCounter] = useState<number>(0);

  // Increment tick counter for diagnostics
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTickCounter(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addPatient = useCallback((patient: Omit<Patient, 'id'> | Patient): void => {
    const newPatient: Patient = {
      ...patient,
      id: 'id' in patient ? patient.id : `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    setPatients(prev => [...prev, newPatient]);
    setHasRealData(true);
  }, []);

  const updatePatient = useCallback((updatedPatient: Patient): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === updatedPatient.id ? updatedPatient : patient
      )
    );
  }, []);

  const updatePatients = useCallback((updatedPatients: Patient[]): void => {
    setPatients(updatedPatients);
  }, []);

  const deletePatient = useCallback((id: string): void => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
  }, []);

  const getPatientById = useCallback((id: string): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  }, [patients]);

  const getPatientsByStatus = useCallback((status: string | string[]): Patient[] => {
    const statusArray = Array.isArray(status) ? status : [status];
    return patients.filter(patient => statusArray.includes(patient.status));
  }, [patients]);

  const getWaitTime = useCallback((patient: Patient): number => {
    const now = new Date();
    if (!patient.checkInTime) return 0;
    const checkInTime = new Date(patient.checkInTime);
    return Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60)); // minutes
  }, []);

  const calculateAverageWaitTime = useCallback((): number => {
    if (patients.length === 0) return 0;
    const totalWaitTime = patients.reduce((total, patient) => total + getWaitTime(patient), 0);
    return Math.floor(totalWaitTime / patients.length);
  }, [patients, getWaitTime]);

  const calculateMaxWaitTime = useCallback((): number => {
    if (patients.length === 0) return 0;
    return Math.max(...patients.map(patient => getWaitTime(patient)));
  }, [patients, getWaitTime]);

  const importPatients = useCallback((newPatients: Patient[]): void => {
    setPatients(newPatients);
    setHasRealData(newPatients.length > 0);
  }, []);

  const importPatientsFromJSON = useCallback((jsonData: Patient[]): void => {
    importPatients(jsonData);
  }, [importPatients]);

  const exportPatientsToJSON = useCallback((): void => {
    const dataStr = JSON.stringify(patients, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `patients_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [patients]);

  const clearAllPatients = useCallback((): void => {
    setPatients([]);
    setHasRealData(false);
  }, []);

  const setPatientStatus = useCallback((patientId: string, newStatus: PatientApptStatus): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, status: newStatus } : patient
      )
    );
  }, []);

  const setPatientRoom = useCallback((patientId: string, newRoom: string): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, room: newRoom } : patient
      )
    );
  }, []);

  const setPatientCheckInTime = useCallback((patientId: string, checkInTime: Date): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, checkInTime: checkInTime.toISOString() } : patient
      )
    );
  }, []);

  const setPatientAppointmentTime = useCallback((patientId: string, appointmentTime: Date): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, appointmentTime: appointmentTime.toISOString() } : patient
      )
    );
  }, []);

  const setPatientChiefComplaint = useCallback((patientId: string, chiefComplaint: string): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, chiefComplaint } : patient
      )
    );
  }, []);

  const setPatientAppointmentType = useCallback((patientId: string, appointmentType: AppointmentType): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, appointmentType } : patient
      )
    );
  }, []);

  const setPatientDOB = useCallback((patientId: string, dob: Date): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, dob: dob.toISOString().split('T')[0] } : patient
      )
    );
  }, []);

  const setPatientName = useCallback((patientId: string, name: string): void => {
    setPatients(prev => 
      prev.map(patient => 
        patient.id === patientId ? { ...patient, name } : patient
      )
    );
  }, []);

  const togglePersistence = useCallback((): void => {
    setPersistenceEnabled(prev => !prev);
  }, []);

  const saveCurrentSession = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMockData = useCallback((): void => {
    const mockPatients: Patient[] = [
      {
        id: 'mock_1',
        name: 'John Doe',
        dob: '1980-01-01',
        status: 'Checked In' as PatientApptStatus,
        checkInTime: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
        appointmentTime: new Date().toISOString(),
        room: 'Room 101',
        chiefComplaint: 'Routine checkup',
        appointmentType: 'Office Visit' as AppointmentType,
        provider: 'Dr. Smith'
      },
      {
        id: 'mock_2',
        name: 'Jane Smith',
        dob: '1975-05-15',
        status: 'arrived' as PatientApptStatus,
        checkInTime: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
        appointmentTime: new Date().toISOString(),
        room: 'Room 102',
        chiefComplaint: 'Follow-up',
        appointmentType: 'Office Visit' as AppointmentType,
        provider: 'Dr. Jones'
      }
    ];
    importPatients(mockPatients);
  }, [importPatients]);

  const contextValue: PatientContextType = {
    patients,
    addPatient,
    updatePatient,
    updatePatients,
    deletePatient,
    getPatientById,
    getPatientsByStatus,
    getWaitTime,
    calculateAverageWaitTime,
    calculateMaxWaitTime,
    importPatients,
    importPatientsFromJSON,
    exportPatientsToJSON,
    clearAllPatients,
    setPatientStatus,
    setPatientRoom,
    setPatientCheckInTime,
    setPatientAppointmentTime,
    setPatientChiefComplaint,
    setPatientAppointmentType,
    setPatientDOB,
    setPatientName,
    persistenceEnabled,
    hasRealData,
    isLoading,
    tickCounter,
    togglePersistence,
    saveCurrentSession,
    loadMockData
  };

  return (
    <PatientContext.Provider value={contextValue}>
      {children}
    </PatientContext.Provider>
  );
};

export default PatientProvider;