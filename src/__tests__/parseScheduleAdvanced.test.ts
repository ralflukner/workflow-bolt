/**
 * Comprehensive Test Suite for Advanced Schedule Parser with JSON Import/Export
 * Tests the Lukner Medical Clinic format parser with encryption and real data scenarios
 */

import {
  parseScheduleAdvanced,
  parseScheduleAuto,
  exportScheduleToJSON,
  importScheduleFromJSON,
  testJSONExportImportCycle,
  getScheduleFromStorage,
  type ImportedPatient,
  type JSONExportOptions,
  type JSONImportOptions
} from '../utils/parseScheduleAdvanced';
import { secureStorage } from '../services/secureStorage';
import { secureLog } from '../utils/redact';

// Mock secureLog for testing
jest.mock('../utils/redact', () => ({
  secureLog: jest.fn()
}));

const mockSecureLog = secureLog as jest.MockedFunction<typeof secureLog>;

// ⚠️ SYNTHETIC TEST DATA ONLY - NO REAL PHI
// All patient data below is synthetic and for testing only
const sampleScheduleText = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
2545 Perryton Pkwy Ste 31, Pampa, TX 79065-2820
Resource Time Status Patient Contact Primary Ins. Eligibility Reason Location
 Notes Balance
RALF LUKNER ROOM 1 9:00 AM Scheduled TESTPATIENT, ALPHA 01/01/1980 (000) 000-0001 INSURANCE 2025 Office Visit Pampa $0.00
RALF LUKNER 10:30 AM Arrived TESTPATIENT, BETA 01/01/1975 (000) 000-0002 SELF PAY NEW PATIENT Pampa $45.50
RALF LUKNER ROOM 2 2:00 PM Checked Out TESTPATIENT, GAMMA 01/01/1992 (000) 000-0003 INSURANCE 2025 F/U on test condition Pampa Member ID: TEST123456 $0.00
RALF LUKNER 3:30 PM Cancelled TESTPATIENT, DELTA 01/01/1985 (000) 000-0004 SELF PAY LAB FOLLOW UP Pampa $25.00`;

describe('Advanced Schedule Parser with JSON Features', () => {
  beforeEach(() => {
    mockSecureLog.mockClear();
    secureStorage.clearAllData();
  });

  afterEach(() => {
    secureStorage.clearAllData();
  });

  describe('Schedule Parsing', () => {

    test('should parse basic schedule format correctly', () => {
      const patients = parseScheduleAdvanced(sampleScheduleText);
      
      expect(patients).toHaveLength(4);
      
      // Check first patient (synthetic test data)
      const firstPatient = patients[0];
      expect(firstPatient.name).toBe('TESTPATIENT, ALPHA');
      expect(firstPatient.dob).toBe('1980-01-01');
      expect(firstPatient.phone).toBe('(000) 000-0001');
      expect(firstPatient.status).toBe('scheduled');
      expect(firstPatient.provider).toBe('RALF LUKNER');
      expect(firstPatient.room).toBe('ROOM 1');
      expect(firstPatient.insurance).toBe('INSURANCE 2025');
      expect(firstPatient.chiefComplaint).toBe('Office Visit');
    });

    test('should handle different appointment statuses correctly', () => {
      const patients = parseScheduleAdvanced(sampleScheduleText);
      
      expect(patients[0].status).toBe('scheduled'); // Scheduled
      expect(patients[1].status).toBe('arrived'); // Arrived
      expect(patients[2].status).toBe('completed'); // Checked Out
      expect(patients[3].status).toBe('Cancelled'); // Cancelled
    });

    test('should parse appointment times correctly', () => {
      const patients = parseScheduleAdvanced(sampleScheduleText, new Date('2025-07-01T00:00:00Z'));
      
      expect(new Date(patients[0].appointmentTime).getHours()).toBe(9);
      expect(new Date(patients[1].appointmentTime).getHours()).toBe(10);
      expect(new Date(patients[2].appointmentTime).getHours()).toBe(14); // 2 PM
      expect(new Date(patients[3].appointmentTime).getHours()).toBe(15); // 3:30 PM
    });

    test('should set check-in times for appropriate statuses', () => {
      const patients = parseScheduleAdvanced(sampleScheduleText);
      
      expect(patients[0].checkInTime).toBeUndefined(); // Scheduled
      expect(patients[1].checkInTime).toBeDefined(); // Arrived
      expect(patients[2].checkInTime).toBeDefined(); // Checked Out
      expect(patients[3].checkInTime).toBeUndefined(); // Cancelled
    });

    test('should validate patient names and handle errors', () => {
      const scheduleWithXSS = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled <script>alert('xss')</script> 01/01/1980 (000) 000-0001 INSURANCE 2025`;
      
      const patients = parseScheduleAdvanced(scheduleWithXSS);
      expect(patients).toHaveLength(1); // Parser should sanitize but not reject
      expect(patients[0].name).toBe('scriptalert(xss)/script'); // XSS should be sanitized
      expect(patients[0].phone).toBe('(000) 000-0001'); // Use test phone number
    });

    test('should save to secure storage when requested', () => {
      const options = {
        saveToSecureStorage: true,
        storageKey: 'test-schedule-save'
      };
      
      const patients = parseScheduleAdvanced(sampleScheduleText, new Date(), options);
      
      expect(patients).toHaveLength(4);
      
      const saved = secureStorage.retrieve('test-schedule-save');
      expect(saved).toBeTruthy();
      expect(saved.patients).toHaveLength(4);
      expect(saved.sourceFormat).toBe('advanced');
    });
  });

  describe('Auto-Detection', () => {
    test('should detect advanced format correctly', () => {
      const patients = parseScheduleAuto(sampleScheduleText, new Date(), { logFunction: mockSecureLog });
      expect(patients).toHaveLength(4);
      expect(mockSecureLog).toHaveBeenCalledWith(
        expect.stringContaining('🔍 Detected advanced schedule format')
      );
    });

    test('should detect TSV format', () => {
      const tsvData = 'Name\tDOB\tTime\nJohn Doe\t01/01/1980\t9:00 AM';
      const patients = parseScheduleAuto(tsvData, new Date(), { logFunction: mockSecureLog });
      expect(mockSecureLog).toHaveBeenCalledWith(
        expect.stringContaining('🔍 Detected TSV format')
      );
    });

    test('should default to advanced parser for unknown format', () => {
      const unknownData = 'Some random text without clear format';
      const patients = parseScheduleAuto(unknownData, new Date(), { logFunction: mockSecureLog });
      expect(mockSecureLog).toHaveBeenCalledWith(
        expect.stringContaining('🔍 Format unclear - defaulting')
      );
    });
  });

  describe('JSON Export Functionality', () => {
    const testPatients: ImportedPatient[] = [
      {
        name: 'JOHNSON, MARY',
        dob: '1980-05-15',
        appointmentTime: '2025-07-01T09:00:00Z',
        appointmentType: 'Office Visit',
        chiefComplaint: 'Office Visit',
        provider: 'RALF LUKNER',
        status: 'scheduled',
        phone: '(806) 665-1234',
        insurance: 'INSURANCE 2025',
        room: 'ROOM 1'
      },
      {
        name: 'SMITH, JOHN',
        dob: '1975-12-22',
        appointmentTime: '2025-07-01T10:30:00Z',
        appointmentType: 'New Patient',
        chiefComplaint: 'NEW PATIENT',
        provider: 'RALF LUKNER',
        status: 'arrived',
        phone: '(806) 555-0123',
        insurance: 'SELF PAY'
      }
    ];

    const exportOptions: JSONExportOptions = {
      password: 'TestExport123!',
      includeMetadata: true,
      sensitiveFields: ['name', 'phone', 'dob']
    };

    test('should export schedule to encrypted JSON blob', async () => {
      const blob = await exportScheduleToJSON(testPatients, exportOptions);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(100);
      
      // Verify JSON structure
      const text = await blob.text();
      const exportData = JSON.parse(text);
      
      expect(exportData.version).toBe('1.0');
      expect(exportData.data).toBeDefined();
      expect(exportData.checksum).toBeDefined();
      expect(exportData.encryptedFields).toContain('name');
      expect(exportData.encryptedFields).toContain('phone');
      expect(exportData.encryptedFields).toContain('dob');
    });

    test('should include metadata in export when requested', async () => {
      const blob = await exportScheduleToJSON(testPatients, exportOptions);
      const text = await blob.text();
      const exportData = JSON.parse(text);
      
      // Check for export metadata
      const exportKey = Object.keys(exportData.data)[0];
      const firstItem = exportData.data[exportKey];
      
      expect(firstItem.data.metadata).toBeDefined();
      expect(firstItem.data.metadata.exportDate).toBeDefined();
      expect(firstItem.data.metadata.version).toBe('1.0');
      expect(firstItem.data.metadata.recordCount).toBe(2);
      expect(firstItem.data.metadata.format).toBe('lukner-medical-clinic');
    });

    test('should exclude metadata when not requested', async () => {
      const noMetadataOptions = { ...exportOptions, includeMetadata: false };
      const blob = await exportScheduleToJSON(testPatients, noMetadataOptions);
      const text = await blob.text();
      const exportData = JSON.parse(text);
      
      const exportKey = Object.keys(exportData.data)[0];
      const firstItem = exportData.data[exportKey];
      
      expect(firstItem.data.metadata).toBeUndefined();
    });
  });

  describe('JSON Import Functionality', () => {
    const testPatients: ImportedPatient[] = [
      {
        name: 'BROWN, LISA',
        dob: '1992-08-30',
        appointmentTime: '2025-07-01T14:00:00Z',
        appointmentType: 'Office Visit',
        chiefComplaint: 'F/U on Insomnia',
        provider: 'RALF LUKNER',
        status: 'completed',
        phone: '(555) 123-4567',
        insurance: 'INSURANCE 2025',
        memberId: 'ABC123456'
      }
    ];

    const password = 'ImportTest456!';

    test('should import schedule from encrypted JSON', async () => {
      // First export
      const exportBlob = await exportScheduleToJSON(testPatients, { password });
      
      // Create file for import
      const file = new File([exportBlob], 'test-import.json', { type: 'application/json' });
      
      // Debug: Check what's in the export
      const exportText = await exportBlob.text();
      console.log('Export text length:', exportText.length);
      console.log('Export text preview:', exportText.substring(0, 200));
      
      // Import
      const importOptions: JSONImportOptions = { password };
      const result = await importScheduleFromJSON(file, importOptions);
      
      // Debug: Check what secureLog captured
      console.log('SecureLog calls:', mockSecureLog.mock.calls.map(call => call[0]));
      console.log('Import result:', result);
      console.log('Import success:', result.success);
      console.log('Import patients count:', result.patients.length);
      console.log('Import errors:', result.errors);
      
      expect(result.success).toBe(true);
      expect(result.patients).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
      
      const importedPatient = result.patients[0];
      expect(importedPatient.name).toBe('BROWN, LISA');
      expect(importedPatient.dob).toBe('1992-08-30');
      expect(importedPatient.phone).toBe('(555) 123-4567');
      expect(importedPatient.memberId).toBe('ABC123456');
    });

    test('should validate imported patient data', async () => {
      // Create export with invalid data
      const invalidPatients = [
        {
          name: '', // Invalid empty name
          dob: '1992-08-30',
          appointmentTime: '2025-07-01T14:00:00Z',
          appointmentType: 'Office Visit',
          chiefComplaint: 'Test',
          provider: 'RALF LUKNER',
          status: 'scheduled'
        }
      ] as ImportedPatient[];
      
      const exportBlob = await exportScheduleToJSON(invalidPatients, { password });
      const file = new File([exportBlob], 'invalid-import.json', { type: 'application/json' });
      
      const result = await importScheduleFromJSON(file, { password });
      
      expect(result.success).toBe(false);
      expect(result.patients).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('missing required fields');
    });

    test('should handle wrong password gracefully', async () => {
      const exportBlob = await exportScheduleToJSON(testPatients, { password });
      const file = new File([exportBlob], 'wrong-password.json', { type: 'application/json' });
      
      const result = await importScheduleFromJSON(file, { password: 'WrongPassword!' });
      
      expect(result.success).toBe(false);
      expect(result.patients).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle checksum validation', async () => {
      const exportBlob = await exportScheduleToJSON(testPatients, { password });
      let exportText = await exportBlob.text();
      
      // Tamper with data
      const exportData = JSON.parse(exportText);
      const firstKey = Object.keys(exportData.data)[0];
      exportData.data[firstKey].data.patients[0].name = 'TAMPERED NAME';
      exportText = JSON.stringify(exportData);
      
      const tamperedFile = new File([exportText], 'tampered.json', { type: 'application/json' });
      const result = await importScheduleFromJSON(tamperedFile, {
        password,
        validateChecksum: true
      });
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Checksum validation failed'))).toBe(true);
    });

    test('should handle overwrite options', async () => {
      // Import once
      const exportBlob1 = await exportScheduleToJSON(testPatients, { password });
      const file1 = new File([exportBlob1], 'first-import.json', { type: 'application/json' });
      await importScheduleFromJSON(file1, { password });
      
      // Try to import again without overwrite
      const exportBlob2 = await exportScheduleToJSON(testPatients, { password });
      const file2 = new File([exportBlob2], 'second-import.json', { type: 'application/json' });
      const result = await importScheduleFromJSON(file2, { 
        password, 
        overwrite: false 
      });
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('already exists'))).toBe(true);
      
      // Now try with overwrite enabled
      const resultWithOverwrite = await importScheduleFromJSON(file2, {
        password,
        overwrite: true
      });
      
      expect(resultWithOverwrite.success).toBe(true);
    });
  });

  describe('JSON Export/Import Cycle Testing', () => {
    const complexPatients: ImportedPatient[] = [
      {
        name: 'WILSON, SARAH',
        dob: '1988-11-12',
        appointmentTime: '2025-07-01T08:00:00Z',
        appointmentType: 'LABS',
        chiefComplaint: 'LAB FOLLOW UP',
        provider: 'RALF LUKNER',
        status: 'appt-prep',
        checkInTime: '2025-07-01T07:45:00Z',
        room: 'ROOM 3',
        phone: '(806) 777-8888',
        insurance: 'Medicare',
        balance: '$12.50',
        memberId: 'MED789012'
      },
      {
        name: 'GARCIA, CARLOS',
        dob: '1965-02-28',
        appointmentTime: '2025-07-01T11:15:00Z',
        appointmentType: 'New Patient',
        chiefComplaint: 'NEW PATIENT CONSULTATION',
        provider: 'RALF LUKNER',
        status: 'With Doctor',
        checkInTime: '2025-07-01T11:00:00Z',
        phone: '(555) 999-0000',
        insurance: 'SELF PAY',
        balance: '$150.00'
      }
    ];

    test('should complete full export/import cycle without data loss', async () => {
      const password = 'CycleTest789!';
      
      const result = await testJSONExportImportCycle(complexPatients, password);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.originalCount).toBe(2);
      expect(result.importedCount).toBe(2);
    });

    test('should detect data corruption in cycle test', async () => {
      // Mock a failing export to test error handling
      const mockExportScheduleToJSON = jest.fn().mockRejectedValue(new Error('Export failed'));
      
      // Temporarily replace the function
      const originalExport = exportScheduleToJSON;
      (global as any).exportScheduleToJSON = mockExportScheduleToJSON;
      
      const result = await testJSONExportImportCycle(complexPatients, 'test-password');
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Restore original function
      (global as any).exportScheduleToJSON = originalExport;
    });

    test('should handle large datasets in cycle test', async () => {
      const largeDataset: ImportedPatient[] = Array.from({ length: 50 }, (_, i) => ({
        name: `PATIENT, TEST${i.toString().padStart(2, '0')}`,
        dob: `198${i % 10}-0${(i % 9) + 1}-${(i % 28) + 1}`.replace(/(\d{4})-0(\d{2})-(\d{2})/, (match, year, month, day) => {
          const m = month.length === 1 ? `0${month}` : month;
          const d = day.length === 1 ? `0${day}` : day;
          return `${year}-${m}-${d}`;
        }),
        appointmentTime: new Date(2025, 6, 1, 9 + (i % 8), (i * 15) % 60).toISOString(),
        appointmentType: i % 3 === 0 ? 'LABS' : 'Office Visit',
        chiefComplaint: `Test complaint ${i}`,
        provider: 'RALF LUKNER',
        status: 'scheduled',
        phone: `(555) ${String(i).padStart(3, '0')}-${String(i * 10).padStart(4, '0')}`,
        insurance: i % 2 === 0 ? 'INSURANCE 2025' : 'SELF PAY'
      }));
      
      const result = await testJSONExportImportCycle(largeDataset, 'LargeTest123!');
      
      expect(result.success).toBe(true);
      expect(result.originalCount).toBe(50);
      expect(result.importedCount).toBe(50);
    });
  });

  describe('Storage Integration', () => {
    test('should retrieve schedule from storage correctly', () => {
      const testScheduleData = {
        patients: [
          {
            name: 'STORAGE, TEST',
            dob: '1990-01-01',
            appointmentTime: '2025-07-01T10:00:00Z',
            appointmentType: 'Office Visit',
            chiefComplaint: 'Storage test',
            provider: 'RALF LUKNER',
            status: 'scheduled'
          }
        ],
        importDate: '2025-07-01T09:00:00Z',
        sourceFormat: 'advanced',
        recordCount: 1
      };
      
      secureStorage.store('test-storage-key', testScheduleData);
      
      const retrieved = getScheduleFromStorage('test-storage-key');
      
      expect(retrieved).toHaveLength(1);
      expect(retrieved![0].name).toBe('STORAGE, TEST');
    });

    test('should return null for non-existent storage key', () => {
      const retrieved = getScheduleFromStorage('non-existent-key');
      expect(retrieved).toBeNull();
    });

    test('should return null for invalid storage data', () => {
      secureStorage.store('invalid-data', { notPatients: 'invalid' });
      
      const retrieved = getScheduleFromStorage('invalid-data');
      expect(retrieved).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed schedule text gracefully', () => {
      const malformedText = 'This is not a valid schedule format at all';
      const patients = parseScheduleAdvanced(malformedText, new Date(), { logFunction: mockSecureLog });
      
      expect(patients).toHaveLength(0);
      expect(mockSecureLog).toHaveBeenCalledWith(
        expect.stringContaining('🎯 Successfully parsed 0 patients')
      );
    });

    test('should handle empty input', () => {
      const patients = parseScheduleAdvanced('');
      expect(patients).toHaveLength(0);
    });

    test('should handle partial data lines', () => {
      const partialData = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:00 AM Scheduled INCOMPLETE_NAME`;
      
      const patients = parseScheduleAdvanced(partialData);
      expect(patients).toHaveLength(0); // Should skip incomplete lines
    });

    test('should handle invalid file types for import', async () => {
      const invalidFile = new File(['not json data'], 'test.txt', { type: 'text/plain' });
      
      const result = await importScheduleFromJSON(invalidFile, { password: 'test' });
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle network-like errors in JSON operations', async () => {
      const testPatients: ImportedPatient[] = [{
        name: 'ERROR, TEST',
        dob: '1990-01-01',
        appointmentTime: '2025-07-01T10:00:00Z',
        appointmentType: 'Office Visit',
        chiefComplaint: 'Error test',
        provider: 'RALF LUKNER',
        status: 'scheduled'
      }];
      
      // Mock crypto API failure
      const originalCrypto = global.crypto;
      (global as any).crypto = undefined;
      
      try {
        const blob = await exportScheduleToJSON(testPatients, { password: 'test' });
        // Should still work with fallback encryption
        expect(blob).toBeInstanceOf(Blob);
      } finally {
        // Restore crypto
        (global as any).crypto = originalCrypto;
      }
    });
  });
});