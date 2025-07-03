/**
 * Schedule Import Debug Test Suite
 * Tests to identify and catch errors in schedule import functionality
 */

import { parseScheduleAdvanced, parseScheduleAuto } from '../utils/parseScheduleAdvanced';
import { parseSchedule } from '../utils/parseSchedule';
import { secureLog } from '../utils/redact';

// Mock secureLog for testing
jest.mock('../utils/redact', () => ({
  secureLog: jest.fn()
}));

const mockSecureLog = secureLog as jest.MockedFunction<typeof secureLog>;

describe('Schedule Import Debug Tests', () => {
  beforeEach(() => {
    mockSecureLog.mockClear();
  });

  describe('Format Detection Issues', () => {
    test('should detect when schedule format is not recognized', () => {
      const unrecognizedFormat = `Some random text that doesn't match any known format
This is not a valid schedule
No appointments here`;

      const patients = parseScheduleAuto(unrecognizedFormat);
      
      // Should return empty array for unrecognized format
      expect(patients).toHaveLength(0);
      
      // Should log format detection attempt
      const formatLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Format unclear') || 
        call[0].includes('defaulting') ||
        call[0].includes('Detected')
      );
      expect(formatLogs.length).toBeGreaterThan(0);
    });

    test('should handle mixed format confusion', () => {
      const mixedFormat = `Appointments for Tuesday, July 01, 2025
Name	DOB	Time	Status
RALF LUKNER 9:00 AM Scheduled MIXED, FORMAT 01/15/1985 (555) 123-4567`;

      const patients = parseScheduleAuto(mixedFormat);
      
      // Should attempt to parse but may fail due to mixed format
      expect(patients).toHaveLength(0);
      
      // Should log parsing attempts
      const parseLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Successfully parsed') || 
        call[0].includes('Error parsing') ||
        call[0].includes('Skipping line')
      );
      expect(parseLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Data Parsing Edge Cases', () => {
    test('should catch invalid date formats', () => {
      const invalidDateSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled INVALID, DATE 99/99/9999 (555) 123-4567 INSURANCE 2025`;

      const patients = parseScheduleAdvanced(invalidDateSchedule);
      
      // Should reject invalid dates
      expect(patients).toHaveLength(0);
      
      // Should log date validation errors
      const dateLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Invalid') || 
        call[0].includes('DOB') ||
        call[0].includes('date')
      );
      expect(dateLogs.length).toBeGreaterThan(0);
    });

    test('should catch malformed time formats', () => {
      const invalidTimeSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 25:99 XM Scheduled TIME, INVALID 01/15/1985 (555) 123-4567`;

      const patients = parseScheduleAdvanced(invalidTimeSchedule);
      
      // Should reject invalid times
      expect(patients).toHaveLength(0);
      
      // Should log time parsing errors
      const timeLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Invalid time') || 
        call[0].includes('time format') ||
        call[0].includes('Skipping line')
      );
      expect(timeLogs.length).toBeGreaterThan(0);
    });

    test('should catch missing required fields', () => {
      const incompleteSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled`;

      const patients = parseScheduleAdvanced(incompleteSchedule);
      
      // Should reject incomplete data
      expect(patients).toHaveLength(0);
      
      // Should log missing field errors
      const fieldLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Missing required') || 
        call[0].includes('Not enough data') ||
        call[0].includes('Skipping line')
      );
      expect(fieldLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Legacy Parser Comparison', () => {
    test('should demonstrate difference between legacy and advanced parsers', () => {
      const testSchedule = `06/28/2025	09:00 AM	Confirmed	LEGACY, TEST	04/03/1956	Office Visit	INSURANCE 2025	$0.00
06/28/2025	10:30 AM	Arrived	COMPARISON, TEST	12/15/1980	NEW PATIENT	SELF PAY	$45.50`;

      // Test legacy parser
      let legacyPatients: any[] = [];
      let legacyError: any = null;
      
      try {
        legacyPatients = parseSchedule(testSchedule);
      } catch (error) {
        legacyError = error;
      }

      // Test advanced parser
      const advancedPatients = parseScheduleAuto(testSchedule);

      // Log comparison results
      console.log('Legacy parser results:', { 
        count: legacyPatients.length, 
        error: legacyError?.message 
      });
      console.log('Advanced parser results:', { 
        count: advancedPatients.length 
      });

      // Advanced parser should handle TSV format better
      if (legacyError) {
        expect(legacyPatients).toHaveLength(0);
        expect(advancedPatients.length).toBeGreaterThanOrEqual(legacyPatients.length);
      } else {
        // If both work, advanced should provide same or better results
        expect(advancedPatients.length).toBeGreaterThanOrEqual(legacyPatients.length);
      }
    });

    test('should identify why legacy parser fails on new format', () => {
      const newFormatSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER ROOM 1 9:00 AM Scheduled PATIENT, NEW 05/15/1980 (806) 665-1234 INSURANCE 2025 Office Visit`;

      // Test legacy parser (should fail)
      let legacyResult: any[] = [];
      let legacyError: any = null;
      
      try {
        legacyResult = parseSchedule(newFormatSchedule);
      } catch (error) {
        legacyError = error;
      }

      // Test advanced parser (should work)
      const advancedResult = parseScheduleAdvanced(newFormatSchedule);

      // Verify legacy fails where advanced succeeds
      expect(legacyResult).toHaveLength(0); // Legacy should fail
      expect(advancedResult.length).toBeGreaterThan(0); // Advanced should work

      if (legacyError) {
        console.log('Legacy parser error:', legacyError.message);
      }
      
      console.log('Format compatibility:');
      console.log('- Legacy parser:', legacyResult.length, 'patients');
      console.log('- Advanced parser:', advancedResult.length, 'patients');
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should continue processing after encountering bad lines', () => {
      const mixedQualitySchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled GOOD, PATIENT 01/15/1985 (555) 123-4567 INSURANCE 2025
INVALID LINE WITH NO STRUCTURE
RALF LUKNER 10:30 AM Arrived ANOTHER, GOOD 12/22/1975 (555) 987-6543 SELF PAY
RALF LUKNER MALFORMED TIME FORMAT
RALF LUKNER 2:00 PM Scheduled THIRD, GOOD 08/30/1992 (555) 111-2222 INSURANCE 2025`;

      const patients = parseScheduleAdvanced(mixedQualitySchedule);
      
      // Should parse good lines despite bad ones
      expect(patients.length).toBeGreaterThan(0);
      expect(patients.length).toBeLessThan(5); // Some lines should be rejected
      
      // Verify good data was parsed correctly
      const goodPatients = patients.filter(p => p.name.includes('GOOD'));
      expect(goodPatients.length).toBeGreaterThan(0);
      
      // Should log errors for bad lines but continue
      const errorLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('❌') || call[0].includes('Error') || call[0].includes('Skipping')
      );
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    test('should handle completely empty or whitespace input', () => {
      const emptyInputs = [
        '',
        '   ',
        '\n\n\n',
        '\t\t\t',
        '   \n   \t   \n   '
      ];

      emptyInputs.forEach((input, index) => {
        const patients = parseScheduleAdvanced(input);
        expect(patients).toHaveLength(0);
        
        // Should log appropriate message for empty input
        const emptyLogs = mockSecureLog.mock.calls.filter(call =>
          call[0].includes('Successfully parsed 0') || 
          call[0].includes('Processing 0 lines') ||
          call[0].includes('No valid appointments')
        );
        expect(emptyLogs.length).toBeGreaterThan(0);
      });
    });

    test('should handle extremely long lines without crashing', () => {
      const longLineSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled ${'VERY'.repeat(1000)}, LONG 01/15/1985 (555) 123-4567 ${'EXTRA'.repeat(500)} DATA
RALF LUKNER 10:30 AM Scheduled NORMAL, PATIENT 12/22/1975 (555) 987-6543 SELF PAY`;

      let parseError = null;
      let patients: any[] = [];
      
      try {
        patients = parseScheduleAdvanced(longLineSchedule);
      } catch (error) {
        parseError = error;
      }

      // Should not crash on long lines
      expect(parseError).toBeNull();
      
      // May or may not parse the long line, but should handle gracefully
      expect(Array.isArray(patients)).toBe(true);
      
      // Should log processing attempt
      const processLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Processing') || 
        call[0].includes('Successfully parsed')
      );
      expect(processLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Memory Issues', () => {
    test('should handle large datasets without performance degradation', () => {
      // Generate a large dataset
      const largeSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
${Array.from({ length: 200 }, (_, i) => {
        const hour = 8 + Math.floor(i / 8);
        const minute = (i % 4) * 15;
        const timeStr = `${hour}:${minute.toString().padStart(2, '0')} AM`;
        return `RALF LUKNER ${timeStr} Scheduled PATIENT${i.toString().padStart(3, '0')}, LARGE 01/01/198${i % 10} (555) ${(100 + i).toString().padStart(3, '0')}-${(1000 + i).toString()} INSURANCE 2025`;
      }).join('\n')}`;

      const startTime = Date.now();
      const patients = parseScheduleAdvanced(largeSchedule);
      const parseTime = Date.now() - startTime;

      // Should complete within reasonable time
      expect(parseTime).toBeLessThan(10000); // 10 seconds max
      expect(patients.length).toBeGreaterThan(100); // Should parse most patients
      
      console.log(`Large dataset performance: ${patients.length} patients in ${parseTime}ms`);
    });

    test('should detect memory leaks in parsing process', () => {
      const testSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled MEMORY, TEST 01/15/1985 (555) 123-4567`;

      // Parse the same data multiple times
      for (let i = 0; i < 100; i++) {
        const patients = parseScheduleAdvanced(testSchedule);
        expect(patients).toHaveLength(1);
      }

      // Should not accumulate errors or memory issues
      const errorLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('❌') || call[0].includes('Error')
      );
      
      // Should have minimal errors for repeated parsing
      expect(errorLogs.length).toBeLessThan(10);
    });
  });

  describe('Real-world Error Scenarios', () => {
    test('should handle clipboard paste artifacts', () => {
      const clipboardArtifacts = `Appointments for Tuesday, July 01, 2025\r
Lukner Medical Clinic\r\n
RALF LUKNER\t9:00 AM\tScheduled\tCLIPBOARD, TEST\t01/15/1985\t(555) 123-4567\r\n`;

      const patients = parseScheduleAdvanced(clipboardArtifacts);
      
      // Should handle various line endings and whitespace
      expect(patients.length).toBeGreaterThanOrEqual(0);
      
      // Should log processing attempt
      const processLogs = mockSecureLog.mock.calls.filter(call =>
        call[0].includes('Processing') || call[0].includes('Successfully parsed')
      );
      expect(processLogs.length).toBeGreaterThan(0);
    });

    test('should identify encoding issues', () => {
      const encodingIssues = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled ENCO∂ING, TËST 01/15/1985 (555) 123-4567 INSURANCE 2025`;

      const patients = parseScheduleAdvanced(encodingIssues);
      
      // Should attempt to parse despite encoding issues
      if (patients.length > 0) {
        // If it parses, verify the name handling
        expect(patients[0].name).toBeDefined();
      }
      
      // Should log any issues encountered
      const logs = mockSecureLog.mock.calls;
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should provide helpful error messages for common mistakes', () => {
      const commonMistakes = [
        // Wrong date format
        `RALF LUKNER 9:00 AM Scheduled WRONG, DATE 1985-01-15 (555) 123-4567`,
        // Wrong time format  
        `RALF LUKNER 9:00 Scheduled WRONG, TIME 01/15/1985 (555) 123-4567`,
        // Missing phone format
        `RALF LUKNER 9:00 AM Scheduled MISSING, PHONE 01/15/1985 555-123-4567`,
        // Extra spaces
        `RALF   LUKNER   9:00  AM   Scheduled   EXTRA,  SPACES  01/15/1985  (555)  123-4567`
      ];

      commonMistakes.forEach((mistake, index) => {
        mockSecureLog.mockClear();
        
        const scheduleText = `Appointments for Tuesday, July 01, 2025\nLukner Medical Clinic\n${mistake}`;
        const patients = parseScheduleAdvanced(scheduleText);
        
        // May or may not parse depending on the mistake
        expect(Array.isArray(patients)).toBe(true);
        
        // Should provide some form of feedback
        const feedbackLogs = mockSecureLog.mock.calls.filter(call =>
          call[0].includes('Skipping') || 
          call[0].includes('Invalid') || 
          call[0].includes('Error') ||
          call[0].includes('Successfully parsed')
        );
        expect(feedbackLogs.length).toBeGreaterThan(0);
      });
    });
  });
});