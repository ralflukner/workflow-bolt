import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, act, waitFor } from '@testing-library/react';
import { PatientProvider } from '../context/PatientContext';
import { TimeProvider } from '../context/TimeProvider';
import { usePatientContext } from '../hooks/usePatientContext';
import { Patient, PatientApptStatus } from '../types';
import React from 'react';

// Mock Firebase and localStorage services to prevent real persistence calls
jest.mock('../services/firebase/dailySessionService', () => ({
  dailySessionService: {
    loadTodaysSession: jest.fn<() => Promise<Patient[]>>().mockResolvedValue([]),
    saveTodaysSession: jest.fn<(patients: Patient[]) => Promise<void>>().mockResolvedValue(undefined),
  }
}));

jest.mock('../services/localStorage/localSessionService', () => ({
  localSessionService: {
    loadTodaysSession: jest.fn<() => Promise<Patient[]>>().mockResolvedValue([]),
    saveTodaysSession: jest.fn<(patients: Patient[]) => Promise<void>>().mockResolvedValue(undefined),
  }
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TimeProvider>
    <PatientProvider>
      {children}
    </PatientProvider>
  </TimeProvider>
);

const ContextConsumer = ({ onContext }: { onContext: (ctx: ReturnType<typeof usePatientContext>) => void }) => {
  const ctx = usePatientContext();
  React.useEffect(() => {
    onContext(ctx);
  }, [ctx, onContext]);
  return null;
};

describe('Schedule Import Special Status Handling', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.clearAllTimers();
  });

  const sampleScheduleData = `05/19/2025\t9:00 AM\tRescheduled\tJAMEY ALLEN COOK\t04/14/1980\tOffice Visit\t-
05/19/2025\t9:30 AM\tCheckedOut\tMARISOL HERNANDEZ MARTINEZ\t08/17/1974\tOffice Visit (Follow Up: nothing has changed)\t-
05/19/2025\t10:00 AM\tCheckedOut\tBRITTON THOMAS WHITE\t03/12/1986\tOffice Visit\t-
05/19/2025\t10:30 AM\tRescheduled\tJEANINE MALONE\t03/05/1970\tSPA - BOTOX / FILLER\t-
05/19/2025\t11:00 AM\tCheckedOut\tDERRICK J MARTIN\t01/09/1971\tSPA - BIOTE\t-
05/19/2025\t11:15 AM\tCheckedOut\tDERRICK J MARTIN\t01/09/1971\tOffice Visit\t-
05/19/2025\t11:30 AM\tCheckedOut\tDESTINY PACK\t10/05/1992\tOffice Visit\t-
05/19/2025\t2:00 PM\tCancelled\tDEAN EDWARD WYMAN\t09/02/1957\tOffice Visit\t-
05/19/2025\t2:00 PM\tCheckedOut\tJUDY HINTON\t10/05/1959\tOffice Visit\t-
05/19/2025\t2:30 PM\tCheckedOut\tJAMES ALEXANDER\t07/18/1969\tOffice Visit\t-
05/19/2025\t3:00 PM\tCheckedOut\tANGEL ELLIOT HALLIBURTON\t06/30/1967\tNEW PATIENT\t-
05/19/2025\t4:00 PM\tCheckedOut\tLYLE GARTON HALLIBURTON\t12/18/1941\tOffice Visit\t-
05/19/2025\t4:30 PM\tConfirmed\tAPRIL LYNN ENGLAND\t02/27/1982\tOffice Visit\t-`;

  const parseScheduleLine = (line: string): Partial<Patient> => {
    const [date, time, status, name, dob, type, notes] = line.split('\t');
    
    const [month, day, year] = date.split('/');
    
    const [timeStr, period] = time.split(' ');
    const [hours, minutes] = timeStr.split(':');
    
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    const appointmentTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hour,
      parseInt(minutes)
    );

    if (isNaN(appointmentTime.getTime())) {
      throw new Error('Invalid date');
    }

    return {
      name,
      dob: new Date(dob).toISOString().split('T')[0],
      appointmentTime: appointmentTime.toISOString(),
      appointmentType: type as Patient['appointmentType'],
      provider: 'Dr. Test',
      status: status as PatientApptStatus,
      chiefComplaint: notes !== '-' ? notes : undefined
    };
  };

  it('should correctly handle Rescheduled appointments', async () => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };
    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for context to be available
    await waitFor(() => {
      expect(context).toBeDefined();
    });

    const rescheduledLines = sampleScheduleData.split('\n')
      .filter(line => line.includes('Rescheduled'));
    
    expect(rescheduledLines.length).toBeGreaterThan(0);
    
    const patients = rescheduledLines.map(line => {
      const patientData = parseScheduleLine(line);
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;
    });

    act(() => {
      context.importPatientsFromJSON(patients);
    });

    await waitFor(() => {
      const importedPatients = context.patients;
      expect(importedPatients).toHaveLength(rescheduledLines.length);
      
      importedPatients.forEach(patient => {
        expect(patient.status).toBe('Rescheduled');
      });
    });
  });

  it('should correctly handle Cancelled appointments', async () => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };
    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for context to be available
    await waitFor(() => {
      expect(context).toBeDefined();
    });

    const cancelledLines = sampleScheduleData.split('\n')
      .filter(line => line.includes('Cancelled'));
    
    expect(cancelledLines.length).toBeGreaterThan(0);
    
    const patients = cancelledLines.map(line => {
      const patientData = parseScheduleLine(line);
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;
    });

    act(() => {
      context.importPatientsFromJSON(patients);
    });

    await waitFor(() => {
      const importedPatients = context.patients;
      expect(importedPatients).toHaveLength(cancelledLines.length);
      
      importedPatients.forEach(patient => {
        expect(patient.status).toBe('Cancelled');
      });
    });
  });

  it('should correctly handle CheckedOut appointments', async () => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };
    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for context to be available
    await waitFor(() => {
      expect(context).toBeDefined();
    });

    const checkedOutLines = sampleScheduleData.split('\n')
      .filter(line => line.includes('CheckedOut'));
    
    expect(checkedOutLines.length).toBeGreaterThan(0);
    
    const patients = checkedOutLines.map(line => {
      const patientData = parseScheduleLine(line);
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;
    });

    act(() => {
      context.importPatientsFromJSON(patients);
    });

    await waitFor(() => {
      const importedPatients = context.patients;
      expect(importedPatients).toHaveLength(checkedOutLines.length);
      
      importedPatients.forEach(patient => {
        expect(patient.status).toBe('completed');
        expect(patient.completedTime).toBeDefined();
      });
    });
  });

  it('should handle all special statuses in a mixed import', async () => {
    let context: ReturnType<typeof usePatientContext>;
    const handleContext = (ctx: ReturnType<typeof usePatientContext>) => {
      context = ctx;
    };
    render(
      <TestWrapper>
        <ContextConsumer onContext={handleContext} />
      </TestWrapper>
    );

    // Wait for context to be available
    await waitFor(() => {
      expect(context).toBeDefined();
    });

    const patients = sampleScheduleData.split('\n').map(line => {
      const patientData = parseScheduleLine(line);
      return {
        id: `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...patientData
      } as Patient;
    });

    act(() => {
      context.importPatientsFromJSON(patients);
    });

    await waitFor(() => {
      const importedPatients = context.patients;
      expect(importedPatients).toHaveLength(sampleScheduleData.split('\n').length);

      const statusCounts = importedPatients.reduce((acc: Record<string, number>, patient: Patient) => {
        acc[patient.status] = (acc[patient.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Status counts:', statusCounts);
      
      expect(statusCounts['Rescheduled']).toBe(2); // Two rescheduled appointments
      expect(statusCounts['Cancelled']).toBe(1);   // One cancelled appointment
      expect(statusCounts['completed']).toBe(9);   // Nine checked out appointments
      
      const scheduledCount = statusCounts['scheduled'] || 0;
      const confirmedCount = statusCounts['Confirmed'] || 0;
      expect(scheduledCount + confirmedCount).toBe(1);   // One confirmed appointment
    });
  });
});
