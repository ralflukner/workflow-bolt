/**
 * HIPAA Compliance Integration Test
 * Tests the complete end-to-end workflow of the HIPAA-compliant implementation
 */

import {
  parseScheduleAdvanced,
  exportScheduleToJSON,
  importScheduleFromJSON,
  testJSONExportImportCycle
} from '../../utils/parseScheduleAdvanced';
import { secureStorage } from '../../services/secureStorage';
import { secureLog } from '../../utils/redact';

// Mock secureLog for testing
jest.mock('../../utils/redact', () => ({
  secureLog: jest.fn()
}));

const mockSecureLog = secureLog as jest.MockedFunction<typeof secureLog>;

describe('HIPAA Compliance Integration Tests', () => {
  beforeEach(() => {
    secureStorage.clearAllData();
    mockSecureLog.mockClear();
  });

  afterEach(() => {
    secureStorage.clearAllData();
  });

  const sampleMedicalSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
2545 Perryton Pkwy Ste 31, Pampa, TX 79065-2820
Resource Time Status Patient Contact Primary Ins. Eligibility Reason Location
 Notes Balance
RALF LUKNER ROOM 1 9:00 AM Scheduled JOHNSON, MARY 05/15/1980 (806) 665-1234 INSURANCE 2025 Office Visit Pampa $0.00
RALF LUKNER 10:30 AM Arrived SMITH, JOHN 12/22/1975 (806) 555-0123 SELF PAY NEW PATIENT Pampa $45.50
RALF LUKNER ROOM 2 2:00 PM Checked Out BROWN, LISA 08/30/1992 (555) 123-4567 INSURANCE 2025 F/U on Insomnia and seeing lighting and other images Pampa Member ID: ABC123456 $0.00
RALF LUKNER 3:30 PM Cancelled DAVIS, ROBERT 03/10/1985 (806) 444-5555 SELF PAY LAB FOLLOW UP Pampa $25.00`;

  describe('End-to-End HIPAA Workflow', () => {
    test('should complete full HIPAA-compliant workflow', async () => {
      // Step 1: Parse schedule with HIPAA compliance
      const patients = parseScheduleAdvanced(sampleMedicalSchedule, new Date('2025-07-01'), {
        securityAudit: true,
        saveToSecureStorage: true,
        storageKey: 'integration-test-data'
      });

      expect(patients).toHaveLength(4);
      expect(patients[0].name).toBe('JOHNSON, MARY');
      expect(patients[1].name).toBe('SMITH, JOHN');

      // Verify secure storage
      const storageStats = secureStorage.getStats();
      expect(storageStats.itemCount).toBeGreaterThan(0);

      // Step 2: Export to encrypted JSON
      const password = 'HIPAACompliant123!';
      const exportBlob = await exportScheduleToJSON(patients, {
        password,
        includeMetadata: true,
        sensitiveFields: ['name', 'phone', 'dob']
      });

      expect(exportBlob.size).toBeGreaterThan(1000); // Should be substantial
      
      // Verify export format
      const exportText = await exportBlob.text();
      const exportData = JSON.parse(exportText);
      expect(exportData.version).toBe('1.0');
      expect(exportData.encryptedFields).toContain('name');
      expect(exportData.checksum).toBeDefined();

      // Step 3: Clear storage and import
      secureStorage.clearAllData();
      expect(secureStorage.getStats().itemCount).toBe(0);

      const importFile = new File([exportBlob], 'hipaa-test.json', { type: 'application/json' });
      const importResult = await importScheduleFromJSON(importFile, {
        password,
        validateChecksum: true
      });

      expect(importResult.success).toBe(true);
      expect(importResult.patients).toHaveLength(4);
      expect(importResult.errors).toHaveLength(0);

      // Step 4: Verify data integrity
      const importedPatients = importResult.patients;
      expect(importedPatients[0].name).toBe('JOHNSON, MARY');
      expect(importedPatients[0].phone).toBe('(806) 665-1234');
      expect(importedPatients[0].dob).toBe('1980-05-15');
      
      // Step 5: Verify audit trail
      const auditLog = secureStorage.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      
      const exportEntry = auditLog.find(entry => entry.action === 'EXPORT');
      const importEntry = auditLog.find(entry => entry.action === 'IMPORT');
      
      expect(exportEntry).toBeTruthy();
      expect(importEntry).toBeTruthy();
    });

    test('should handle large dataset with HIPAA compliance', async () => {
      // Generate a large dataset
      const largeSchedule = `Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
Resource Time Status Patient Contact Primary Ins. Eligibility Reason Location Notes Balance
${Array.from({ length: 50 }, (_, i) => {
        const hour = 9 + Math.floor(i / 4);
        const minute = (i % 4) * 15;
        const timeStr = `${hour}:${minute.toString().padStart(2, '0')} AM`;
        const patientName = `PATIENT${i.toString().padStart(2, '0')}, TEST`;
        const dob = `0${(i % 9) + 1}/1${(i % 9) + 1}/198${i % 10}`;
        const phone = `(555) ${(100 + i).toString()}-${(1000 + i * 10).toString()}`;
        
        return `RALF LUKNER ${timeStr} Scheduled ${patientName} ${dob} ${phone} INSURANCE 2025 Office Visit Pampa $0.00`;
      }).join('\n')}`;

      const startTime = Date.now();

      // Parse large dataset
      const patients = parseScheduleAdvanced(largeSchedule, new Date('2025-07-01'), {
        securityAudit: true,
        saveToSecureStorage: true
      });

      const parseTime = Date.now() - startTime;
      expect(parseTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(patients.length).toBe(50);

      // Test export/import cycle
      const cycleResult = await testJSONExportImportCycle(patients, 'LargeDataTest456!');
      
      expect(cycleResult.success).toBe(true);
      expect(cycleResult.originalCount).toBe(50);
      expect(cycleResult.importedCount).toBe(50);
      expect(cycleResult.errors).toHaveLength(0);
    });

    test('should maintain HIPAA compliance under error conditions', async () => {
      // Test with malformed data
      const malformedSchedule = `Appointments for Tuesday, July 01, 2025
RALF LUKNER 9:00 AM Scheduled <script>alert('xss')</script> 05/15/1980 (806) 665-1234`;

      const patients = parseScheduleAdvanced(malformedSchedule, new Date('2025-07-01'), {
        securityAudit: true
      });

      // Should reject malicious input
      expect(patients).toHaveLength(0);

      // Verify audit log shows security event
      const auditLog = secureStorage.getAuditLog();
      expect(auditLog.some(entry => entry.success === false)).toBe(true);
    });

    test('should handle password protection correctly', async () => {
      const patients = parseScheduleAdvanced(sampleMedicalSchedule, new Date('2025-07-01'));
      
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword456!';

      // Export with correct password
      const exportBlob = await exportScheduleToJSON(patients, { password: correctPassword });
      
      // Try to import with wrong password
      const wrongFile = new File([exportBlob], 'wrong-password.json', { type: 'application/json' });
      const wrongResult = await importScheduleFromJSON(wrongFile, { password: wrongPassword });
      
      expect(wrongResult.success).toBe(false);
      expect(wrongResult.patients).toHaveLength(0);
      expect(wrongResult.errors.length).toBeGreaterThan(0);

      // Import with correct password
      const correctFile = new File([exportBlob], 'correct-password.json', { type: 'application/json' });
      const correctResult = await importScheduleFromJSON(correctFile, { password: correctPassword });
      
      expect(correctResult.success).toBe(true);
      expect(correctResult.patients).toHaveLength(4);
    });

    test('should demonstrate security difference between modes', async () => {
      const patients = parseScheduleAdvanced(sampleMedicalSchedule, new Date('2025-07-01'), {
        securityAudit: true,
        saveToSecureStorage: true
      });

      // Check that secure mode logs show HIPAA compliance
      const secureAuditLog = secureStorage.getAuditLog();
      expect(secureAuditLog.length).toBeGreaterThan(0);
      
      // Verify PHI protection in logs
      const hasSecurityLog = mockSecureLog.mock.calls.some(call => 
        call[0].includes('HIPAA') || call[0].includes('🔒') || call[0].includes('🛡️')
      );
      expect(hasSecurityLog).toBe(true);

      // Verify sensitive data is not in plain text in logs
      const hasPlainTextPHI = mockSecureLog.mock.calls.some(call =>
        call[0].includes('JOHNSON, MARY') || call[0].includes('(806) 665-1234')
      );
      expect(hasPlainTextPHI).toBe(false);
    });

    test('should handle data expiration correctly', (done) => {
      // Create storage with very short expiration for testing
      const shortStorage = new (secureStorage.constructor as any)({
        expirationTime: 100, // 100ms
        enableAuditLogging: true
      });

      const testData = { 
        name: 'EXPIRATION, TEST',
        dob: '1990-01-01',
        sensitive: 'data'
      };

      shortStorage.store('expiration-test', testData);
      
      // Data should exist immediately
      expect(shortStorage.retrieve('expiration-test')).toEqual(testData);

      // Data should expire after timeout
      setTimeout(() => {
        const expiredData = shortStorage.retrieve('expiration-test');
        expect(expiredData).toBeNull();
        
        // Check audit log for expiration event
        const auditLog = shortStorage.getAuditLog();
        const expirationEntry = auditLog.find(entry => entry.action === 'EXPIRE');
        expect(expirationEntry).toBeTruthy();
        
        shortStorage.destroy();
        done();
      }, 150);
    });
  });

  describe('Security Validation', () => {
    test('should encrypt sensitive fields in export', async () => {
      const patients = parseScheduleAdvanced(sampleMedicalSchedule, new Date('2025-07-01'));
      const exportBlob = await exportScheduleToJSON(patients, {
        password: 'TestEncryption123!',
        sensitiveFields: ['name', 'phone']
      });

      const exportText = await exportBlob.text();
      
      // Raw export should not contain plain text PHI
      expect(exportText).not.toContain('JOHNSON, MARY');
      expect(exportText).not.toContain('(806) 665-1234');
      
      // Should contain encrypted indicators
      expect(exportText).toContain('encrypted');
      expect(exportText).toContain('algorithm');
    });

    test('should validate data integrity with checksums', async () => {
      const patients = parseScheduleAdvanced(sampleMedicalSchedule, new Date('2025-07-01'));
      const exportBlob = await exportScheduleToJSON(patients, { password: 'Integrity123!' });
      
      let exportText = await exportBlob.text();
      const originalData = JSON.parse(exportText);
      
      // Tamper with the data
      const tamperedData = { ...originalData };
      const firstKey = Object.keys(tamperedData.data)[0];
      tamperedData.data[firstKey].data.patients[0].name = 'TAMPERED NAME';
      
      const tamperedFile = new File([JSON.stringify(tamperedData)], 'tampered.json', { 
        type: 'application/json' 
      });
      
      const importResult = await importScheduleFromJSON(tamperedFile, {
        password: 'Integrity123!',
        validateChecksum: true
      });
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors[0]).toContain('Checksum validation failed');
    });

    test('should handle memory cleanup on page unload simulation', () => {
      // Store some test data
      secureStorage.store('cleanup-test-1', { data: 'sensitive1' });
      secureStorage.store('cleanup-test-2', { data: 'sensitive2' });
      
      expect(secureStorage.getStats().itemCount).toBe(2);
      
      // Simulate page unload
      if (typeof window !== 'undefined') {
        const event = new Event('beforeunload');
        window.dispatchEvent(event);
      } else {
        // Manual cleanup for test environment
        secureStorage.clearAllData();
      }
      
      // Data should be cleared
      expect(secureStorage.retrieve('cleanup-test-1')).toBeNull();
      expect(secureStorage.retrieve('cleanup-test-2')).toBeNull();
    });
  });

  describe('Performance Under Load', () => {
    test('should handle concurrent operations safely', async () => {
      const patients = parseScheduleAdvanced(sampleMedicalSchedule, new Date('2025-07-01'));
      
      // Simulate concurrent export operations
      const password = 'ConcurrentTest123!';
      const exportPromises = Array.from({ length: 5 }, () =>
        exportScheduleToJSON(patients, { password })
      );
      
      const results = await Promise.all(exportPromises);
      
      // All exports should succeed
      results.forEach(blob => {
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.size).toBeGreaterThan(0);
      });
      
      // All exports should produce identical content
      const texts = await Promise.all(results.map(blob => blob.text()));
      const firstExport = JSON.parse(texts[0]);
      
      texts.slice(1).forEach(text => {
        const exportData = JSON.parse(text);
        expect(exportData.checksum).toMatch(/^[a-f0-9]{8}$/);
        expect(exportData.data).toEqual(firstExport.data);
      });
    });

    test('should maintain performance with large audit logs', () => {
      // Generate large audit log
      for (let i = 0; i < 2000; i++) {
        secureStorage.store(`perf-test-${i}`, { data: `test-data-${i}` });
        secureStorage.retrieve(`perf-test-${i}`);
        secureStorage.delete(`perf-test-${i}`);
      }
      
      const auditLog = secureStorage.getAuditLog();
      
      // Should maintain reasonable audit log size
      expect(auditLog.length).toBeLessThanOrEqual(1000);
      
      // Health check should still complete quickly
      const startTime = Date.now();
      const health = secureStorage.healthCheck();
      const checkTime = Date.now() - startTime;
      
      expect(checkTime).toBeLessThan(100); // Should complete within 100ms
      expect(health.status).toBeDefined();
    });
  });
});