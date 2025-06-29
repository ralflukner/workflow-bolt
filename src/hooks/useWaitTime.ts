import { useState, useCallback, useRef, useMemo } from 'react';
import { Patient, PatientApptStatus } from '../types';
import { useTimeContext } from './useTimeContext';

interface WaitTimeState {
  currentWaitTime: number;
  totalTime: number;
  lastCalculated: Date;
  error: string | null;
}

interface WaitTimeResult {
  currentWaitTime: number;
  totalTime: number;
  error?: string;
}

const CACHE_TTL = 60000; // 1 minute cache TTL

// Time zone offset in minutes for the clinic's timezone (America/Chicago)
const CLINIC_TIMEZONE_OFFSET = -300; // UTC-5 for CST

// Status groups that affect wait time calculation
const WAITING_STATUSES: PatientApptStatus[] = [
  'arrived',
  'appt-prep',
  'ready-for-md'
];

const COMPLETED_STATUSES: PatientApptStatus[] = [
  'completed',
  'Checked Out',
  'No Show',
  'Cancelled'
];

export const useWaitTime = (patient: Patient) => {
  const { getCurrentTime } = useTimeContext();
  const [state, setState] = useState<WaitTimeState>(() => ({
    currentWaitTime: 0,
    totalTime: 0,
    lastCalculated: new Date(),
    error: null
  }));

  // Cache for storing calculated values
  const cacheRef = useRef<{
    result: WaitTimeResult;
    timestamp: number;
  } | null>(null);

  const validateDate = (date: Date): boolean => {
    if (!(date instanceof Date)) return false;
    if (isNaN(date.getTime())) return false;
    
    // Check if date is in the future
    const now = new Date();
    if (date > now) return false;
    
    // Check if date is too far in the past (e.g., more than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (date < oneYearAgo) return false;
    
    return true;
  };

  const normalizeDate = (date: Date): Date => {
    // Create a new date object to avoid mutating the input
    const normalized = new Date(date);
    
    // Adjust for clinic timezone
    const offset = normalized.getTimezoneOffset();
    const clinicOffset = CLINIC_TIMEZONE_OFFSET;
    const diff = offset - clinicOffset;
    
    // Apply the timezone difference
    normalized.setMinutes(normalized.getMinutes() + diff);
    
    return normalized;
  };

  const calculateWaitTime = useCallback((): WaitTimeResult => {
    try {
      // Return cached result if available and not expired
      const now = Date.now();
      if (cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_TTL) {
        return cacheRef.current.result;
      }

      // Handle cases where wait time calculation is not applicable
      if (!patient.checkInTime || COMPLETED_STATUSES.includes(patient.status as PatientApptStatus)) {
        return { currentWaitTime: 0, totalTime: 0 };
      }

      const checkInTime = normalizeDate(new Date(patient.checkInTime));
      
      // Validate check-in time
      if (!validateDate(checkInTime)) {
        throw new Error('Invalid check-in time');
      }

      // Determine end time based on patient status and timestamps
      let endTime: Date;
      if (patient.withDoctorTime) {
        endTime = normalizeDate(new Date(patient.withDoctorTime));
        if (!validateDate(endTime)) {
          throw new Error('Invalid with-doctor time');
        }
      } else if (WAITING_STATUSES.includes(patient.status as PatientApptStatus)) {
        endTime = normalizeDate(getCurrentTime());
      } else {
        // For other statuses, use check-in time as end time
        endTime = checkInTime;
      }

      // Calculate wait time in milliseconds
      const waitTimeMs = endTime.valueOf() - checkInTime.valueOf();
      
      // Ensure non-negative wait time
      const currentWaitTime = Math.max(0, Math.floor(waitTimeMs / 60000));

      // Calculate total time if patient has completed their visit
      let totalTime = currentWaitTime;
      if (patient.completedTime) {
        const completedTime = normalizeDate(new Date(patient.completedTime));
        if (!validateDate(completedTime)) {
          throw new Error('Invalid completion time');
        }
        const totalTimeMs = completedTime.valueOf() - checkInTime.valueOf();
        totalTime = Math.max(0, Math.floor(totalTimeMs / 60000));
      }

      // Cache the result
      const result = { currentWaitTime, totalTime };
      cacheRef.current = {
        result,
        timestamp: now
      };

      return result;
    } catch (error) {
      console.error('Wait time calculation error:', error);
      return { 
        currentWaitTime: 0, 
        totalTime: 0, 
        error: error instanceof Error ? error.message : 'Unknown error in wait time calculation'
      };
    }
  }, [patient, getCurrentTime]);

  // Use useMemo for derived state instead of useEffect
  const waitTimeResult = useMemo(() => {
    // Force cache invalidation when patient status changes
    cacheRef.current = null;
    
    const result = calculateWaitTime();
    setState({
      currentWaitTime: result.currentWaitTime,
      totalTime: result.totalTime,
      lastCalculated: new Date(),
      error: result.error || null
    });
    return result;
  }, [calculateWaitTime, patient.status, patient.checkInTime, patient.withDoctorTime, patient.completedTime]);

  return {
    ...state,
    // Helper method to get formatted wait time display
    getWaitTimeDisplay: (): string => {
      if (state.error) {
        return 'Error calculating wait time';
      }
      if (COMPLETED_STATUSES.includes(patient.status as PatientApptStatus)) {
        return `Total: ${state.totalTime} min`;
      }
      return `Wait: ${state.currentWaitTime} min`;
    },
    // Helper method to check if wait time exceeds threshold
    isWaitTimeExceeded: (thresholdMinutes: number): boolean => {
      return state.currentWaitTime > thresholdMinutes;
    },
    // Helper method to get the current status of wait time
    getWaitTimeStatus: (): 'waiting' | 'completed' | 'error' => {
      if (state.error) return 'error';
      if (COMPLETED_STATUSES.includes(patient.status as PatientApptStatus)) return 'completed';
      return 'waiting';
    }
  };
}; 