/**
 * Comprehensive unit tests for parseSchedule utility
 * These are pure data tests that run fast without React/RTL
 */

import { parseSchedule, ImportedPatient } from '../parseSchedule';
import { PatientApptStatus, AppointmentType } from '../../types';

// Mock current time for consistent testing
const MOCK_NOW = new Date('2023-01-01T10:00:00.000Z');

// Helper to create a valid TSV row
const createRow = (overrides: Partial<{
  date: string;
  time: string;
  status: string;
  name: string;
  dob: string;
  type: string;
}> = {}) => {
  const defaults = {
    date: '01/15/2023',
    time: '9:00 AM',
    status: 'Scheduled',
    name: 'Test Patient',
    dob: '01/01/1990',
    type: 'Office Visit'
  };
  const row = { ...defaults, ...overrides };
  return `${row.date}\t${row.time}\t${row.status}\t${row.name}\t${row.dob}\t${row.type}`;
};

describe('parseSchedule', () => {
  describe('Basic Parsing', () => {
    it('parses a single valid row correctly', () => {
      const tsv = createRow();
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Test Patient',
        dob: '1990-01-01',
        appointmentTime: '2023-01-15T09:00:00.000Z',
        appointmentType: 'Office Visit',
        chiefComplaint: 'Office Visit',
        provider: 'Dr. Lukner',
        status: 'scheduled',
        checkInTime: undefined,
        room: undefined
      });
    });

    it('parses multiple valid rows', () => {
      const tsv = [
        createRow({ name: 'John Doe', time: '9:00 AM' }),
        createRow({ name: 'Jane Smith', time: '10:00 AM' })
      ].join('\n');
      
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Jane Smith');
      expect(result[0].appointmentTime).toBe('2023-01-15T09:00:00.000Z');
      expect(result[1].appointmentTime).toBe('2023-01-15T10:00:00.000Z');
    });

    it('handles empty input', () => {
      expect(parseSchedule('', MOCK_NOW)).toEqual([]);
      expect(parseSchedule('   ', MOCK_NOW)).toEqual([]);
      expect(parseSchedule('\n\n', MOCK_NOW)).toEqual([]);
    });

    it('accepts custom provider', () => {
      const tsv = createRow();
      const result = parseSchedule(tsv, MOCK_NOW, { defaultProvider: 'Dr. Custom' });
      
      expect(result[0].provider).toBe('Dr. Custom');
    });
  });

  describe('Time Parsing', () => {
    const timeTestCases: Array<[string, string, string]> = [
      ['9:00 AM', '09:00:00', 'morning single digit'],
      ['09:00 AM', '09:00:00', 'morning double digit'],
      ['12:00 AM', '00:00:00', 'midnight'],
      ['12:30 AM', '00:30:00', 'after midnight'],
      ['1:00 PM', '13:00:00', 'afternoon single digit'],
      ['12:00 PM', '12:00:00', 'noon'],
      ['12:30 PM', '12:30:00', 'after noon'],
      ['11:59 PM', '23:59:00', 'late night'],
      ['2:30 PM', '14:30:00', 'afternoon with minutes'],
      ['10:15 AM', '10:15:00', 'morning with minutes']
    ];

    it.each(timeTestCases)('converts %s to %s (%s)', (inputTime, expectedTime, description) => {
      const tsv = createRow({ time: inputTime });
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0].appointmentTime).toMatch(new RegExp(`T${expectedTime}`));
    });

    it('skips rows with invalid time formats', () => {
      const mockLog = jest.fn();
      const invalidTimes = [
        'invalid-time',
        '25:00 AM',
        '12:60 PM',
        '9 AM',
        'AM 9:00',
        '9:00',
        ''
      ];

      invalidTimes.forEach(invalidTime => {
        const tsv = createRow({ time: invalidTime });
        const result = parseSchedule(tsv, MOCK_NOW, { logFunction: mockLog });
        expect(result).toEqual([]);
      });
    });
  });

  describe('Date Parsing', () => {
    it('parses various date formats correctly', () => {
      const dateTestCases = [
        ['01/15/2023', '2023-01-15'],
        ['1/5/2023', '2023-01-05'],
        ['12/31/2023', '2023-12-31']
      ];

      dateTestCases.forEach(([inputDate, expectedDate]) => {
        const tsv = createRow({ date: inputDate });
        const result = parseSchedule(tsv, MOCK_NOW);
        
        expect(result).toHaveLength(1);
        expect(result[0].appointmentTime).toContain(expectedDate);
      });
    });

    it('skips rows with invalid date formats', () => {
      const mockLog = jest.fn();
      const invalidDates = [
        'invalid-date',
        '13/01/2023', // Invalid month
        '01/32/2023', // Invalid day
        '2023-01-15', // Wrong format
        '01-15-2023', // Wrong format
        ''
      ];

      invalidDates.forEach(invalidDate => {
        const tsv = createRow({ date: invalidDate });
        const result = parseSchedule(tsv, MOCK_NOW, { logFunction: mockLog });
        expect(result).toEqual([]);
      });
    });
  });

  describe('DOB Parsing', () => {
    it('formats DOB correctly', () => {
      const dobTestCases = [
        ['01/01/1990', '1990-01-01'],
        ['12/31/1985', '1985-12-31'],
        ['1/5/2000', '2000-01-05']
      ];

      dobTestCases.forEach(([inputDob, expectedDob]) => {
        const tsv = createRow({ dob: inputDob });
        const result = parseSchedule(tsv, MOCK_NOW);
        
        expect(result).toHaveLength(1);
        expect(result[0].dob).toBe(expectedDob);
      });
    });

    it('skips rows with invalid DOB formats', () => {
      const mockLog = jest.fn();
      const invalidDobs = [
        'invalid-dob',
        '1990-01-01', // Wrong format
        '01-01-1990', // Wrong format
        '13/01/1990', // Invalid month
        '01/32/1990', // Invalid day
        ''
      ];

      invalidDobs.forEach(invalidDob => {
        const tsv = createRow({ dob: invalidDob });
        const result = parseSchedule(tsv, MOCK_NOW, { logFunction: mockLog });
        expect(result).toEqual([]);
      });
    });
  });

  describe('Status Mapping', () => {
    const statusMappingCases: Array<[string, PatientApptStatus]> = [
      // Confirmed/Scheduled statuses
      ['confirmed', 'scheduled'],
      ['Confirmed', 'scheduled'],
      ['scheduled', 'scheduled'],
      ['Scheduled', 'scheduled'],
      ['reminder sent', 'scheduled'],
      
      // Arrived statuses
      ['arrived', 'arrived'],
      ['Arrived', 'arrived'],
      ['checked in', 'arrived'],
      
      // Appointment prep statuses
      ['roomed', 'appt-prep'],
      ['appt prep started', 'appt-prep'],
      
      // Ready for doctor
      ['ready for md', 'ready-for-md'],
      
      // With doctor
      ['with doctor', 'With Doctor'],
      ['With Doctor', 'With Doctor'],
      
      // Seen by doctor
      ['seen by md', 'seen-by-md'],
      
      // Completed/Checked out
      ['checked out', 'completed'],
      ['checkedout', 'completed'],
      
      // Rescheduled
      ['rescheduled', 'Rescheduled'],
      
      // Cancelled
      ['cancelled', 'Cancelled'],
      ['canceled', 'Cancelled'],
      
      // No Show
      ['no show', 'No Show'],
      
      // Unknown status defaults to scheduled
      ['unknown status', 'scheduled'],
      ['', 'scheduled']
    ];

    it.each(statusMappingCases)('maps "%s" to "%s"', (inputStatus, expectedStatus) => {
      const tsv = createRow({ status: inputStatus });
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(expectedStatus);
    });
  });

  describe('Appointment Type Mapping', () => {
    it('maps lab-related types to LABS', () => {
      const labTypes = [
        'Lab Work',
        'LAB WORK',
        'lab work',
        'Blood Lab',
        'Laboratory'
      ];

      labTypes.forEach(labType => {
        const tsv = createRow({ type: labType });
        const result = parseSchedule(tsv, MOCK_NOW);
        
        expect(result).toHaveLength(1);
        expect(result[0].appointmentType).toBe('LABS');
        expect(result[0].chiefComplaint).toBe(labType);
      });
    });

    it('defaults non-lab types to Office Visit', () => {
      const officeTypes = [
        'Office Visit',
        'Consultation',
        'Follow-up',
        'Annual Physical'
      ];

      officeTypes.forEach(officeType => {
        const tsv = createRow({ type: officeType });
        const result = parseSchedule(tsv, MOCK_NOW);
        
        expect(result).toHaveLength(1);
        expect(result[0].appointmentType).toBe('Office Visit');
        expect(result[0].chiefComplaint).toBe(officeType);
      });
    });

    it('handles empty appointment type correctly', () => {
      const mockLog = jest.fn();
      const tsv = createRow({ type: '' });
      
      // Manually check what createRow produces
      const parts = tsv.split('\t');
      
      expect(parts).toHaveLength(6); // Should have 6 parts
      expect(parts[5]).toBe(''); // Last part should be empty string
      
      const result = parseSchedule(tsv, MOCK_NOW, { logFunction: mockLog });
      
      // Check what the log says
      const logCalls = mockLog.mock.calls.map(call => call[0]);
      expect(logCalls).toContain('Processing 1 lines');
      
      if (result.length === 0) {
        // If parsing failed, check why
        const skipMessage = logCalls.find(log => log.includes('Skipping'));
        if (skipMessage) {
          throw new Error(`Parsing failed: ${skipMessage}`);
        }
      }
      
      expect(result).toHaveLength(1);
      expect(result[0].appointmentType).toBe('Office Visit');
      expect(result[0].chiefComplaint).toBe('Follow-up');
    });
  });

  describe('Check-in Time and Room Assignment', () => {
    const checkedInStatuses = [
      'arrived', 'appt-prep', 'ready-for-md', 'With Doctor', 'seen-by-md', 'completed'
    ];

    it.each(checkedInStatuses)('sets check-in time for %s status', (status) => {
      const tsv = createRow({ status });
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0].checkInTime).toBeDefined();
      
      // Check-in time should be 30 minutes before appointment
      const appointmentTime = new Date(result[0].appointmentTime);
      const checkInTime = new Date(result[0].checkInTime!);
      const diffMinutes = (appointmentTime.getTime() - checkInTime.getTime()) / (1000 * 60);
      expect(diffMinutes).toBe(30);
    });

    const roomStatuses = ['appt-prep', 'ready-for-md', 'With Doctor'];

    it.each(roomStatuses)('assigns room for %s status', (status) => {
      const tsv = createRow({ status });
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0].room).toBe('Waiting');
    });

    it('does not set check-in time for non-checked-in statuses', () => {
      const notCheckedInStatuses = ['scheduled', 'Cancelled', 'No Show', 'Rescheduled'];
      
      notCheckedInStatuses.forEach(status => {
        const tsv = createRow({ status });
        const result = parseSchedule(tsv, MOCK_NOW);
        
        expect(result).toHaveLength(1);
        expect(result[0].checkInTime).toBeUndefined();
        expect(result[0].room).toBeUndefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('skips rows with insufficient columns', () => {
      const mockLog = jest.fn();
      const insufficientData = [
        '01/15/2023',
        '01/15/2023\t9:00 AM',
        '01/15/2023\t9:00 AM\tScheduled',
        '01/15/2023\t9:00 AM\tScheduled\tTest Patient',
        '01/15/2023\t9:00 AM\tScheduled\tTest Patient\t01/01/1990'
        // Missing 6th column (type)
      ];

      insufficientData.forEach(data => {
        const result = parseSchedule(data, MOCK_NOW, { logFunction: mockLog });
        expect(result).toEqual([]);
      });

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('not enough columns')
      );
    });

    it('handles mixed valid and invalid data', () => {
      const mixedData = [
        'invalid-date\t9:00 AM\tScheduled\tBad Date\t01/01/1990\tOffice Visit',
        createRow({ name: 'Good Patient' }),
        '01/15/2023\tbad-time\tScheduled\tBad Time\t01/01/1990\tOffice Visit'
      ].join('\n');

      const result = parseSchedule(mixedData, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Good Patient');
    });

    it('trims whitespace from input data', () => {
      const tsv = '  01/15/2023  \t  9:00 AM  \t  Scheduled  \t  Test Patient  \t  01/01/1990  \t  Office Visit  ';
      const result = parseSchedule(tsv, MOCK_NOW);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Patient');
      expect(result[0].chiefComplaint).toBe('Office Visit');
    });
  });

  describe('Logging', () => {
    it('calls log function with parsing progress', () => {
      const mockLog = jest.fn();
      const tsv = [
        createRow({ name: 'Patient 1' }),
        createRow({ name: 'Patient 2' })
      ].join('\n');

      parseSchedule(tsv, MOCK_NOW, { logFunction: mockLog });

      expect(mockLog).toHaveBeenCalledWith('Processing 2 lines');
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('Successfully parsed line 1: Patient 1')
      );
      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('Successfully parsed line 2: Patient 2')
      );
    });

    it('logs errors for invalid data', () => {
      const mockLog = jest.fn();
      const invalidTsv = createRow({ time: 'invalid-time' });

      parseSchedule(invalidTsv, MOCK_NOW, { logFunction: mockLog });

      expect(mockLog).toHaveBeenCalledWith(
        expect.stringContaining('invalid time format')
      );
    });

    it('does not log when no log function provided', () => {
      // Should not throw error when no log function is provided
      expect(() => {
        parseSchedule(createRow(), MOCK_NOW);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('handles large datasets efficiently', () => {
      // Generate 1000 rows of test data with valid times
      const largeDataset = Array.from({ length: 1000 }, (_, i) => {
        const hour = (9 + (i % 4)); // 9, 10, 11, 12 AM
        const minute = ((i * 15) % 60);
        const time = `${hour}:${String(minute).padStart(2, '0')} AM`;
        
        return createRow({ 
          name: `Patient ${i + 1}`,
          time: time
        });
      }).join('\n');

      const startTime = Date.now();
      const result = parseSchedule(largeDataset, MOCK_NOW);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});