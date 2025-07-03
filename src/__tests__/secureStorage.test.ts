/**
 * Comprehensive Test Suite for HIPAA-Compliant Secure Storage
 * Tests encryption, JSON export/import, and security features with minimal mocking
 */

import { SecureStorage, secureStorage } from '../services/secureStorage';
import { secureLog } from '../utils/redact';

// Mock secureLog to capture logs during testing
jest.mock('../utils/redact', () => ({
  secureLog: jest.fn()
}));

const mockSecureLog = secureLog as jest.MockedFunction<typeof secureLog>;

describe('SecureStorage', () => {
  let storage: SecureStorage;
  
  beforeEach(() => {
    storage = new SecureStorage({
      expirationTime: 60000, // 1 minute for faster testing
      enableAuditLogging: true
    });
    mockSecureLog.mockClear();
  });

  afterEach(() => {
    storage.destroy();
  });

  describe('Basic Storage Operations', () => {
    test('should store and retrieve data successfully', () => {
      const testData = { name: 'John Doe', age: 30 };
      const key = 'test-patient';
      
      const stored = storage.store(key, testData, 'test-user');
      expect(stored).toBe(true);
      
      const retrieved = storage.retrieve(key, 'test-user');
      expect(retrieved).toEqual(testData);
    });

    test('should handle data expiration', (done) => {
      const testData = { name: 'Jane Smith', expired: true };
      const key = 'expiring-data';
      
      // Create storage with very short expiration
      const shortStorage = new SecureStorage({ expirationTime: 100 }); // 100ms
      
      shortStorage.store(key, testData);
      
      // Use real timers for this test
      jest.useRealTimers();
      setTimeout(() => {
        const retrieved = shortStorage.retrieve(key);
        expect(retrieved).toBeNull();
        shortStorage.destroy();
        jest.useFakeTimers();
        done();
      }, 150);
    }, 10000); // 10 second timeout

    test('should delete data successfully', () => {
      const testData = { name: 'Delete Me' };
      const key = 'to-delete';
      
      storage.store(key, testData);
      expect(storage.retrieve(key)).toEqual(testData);
      
      const deleted = storage.delete(key);
      expect(deleted).toBe(true);
      expect(storage.retrieve(key)).toBeNull();
    });

    test('should clear all data', () => {
      storage.store('key1', { data: 'test1' });
      storage.store('key2', { data: 'test2' });
      
      const statsBefore = storage.getStats();
      expect(statsBefore.itemCount).toBe(2);
      
      storage.clearAllData();
      
      const statsAfter = storage.getStats();
      expect(statsAfter.itemCount).toBe(0);
    });
  });

  describe('Security Features', () => {
    test('should obfuscate stored data', () => {
      const sensitiveData = { ssn: '123-45-6789', name: 'Patient Name' };
      const key = 'sensitive-patient';
      
      storage.store(key, sensitiveData);
      
      // Access the private storage to check obfuscation
      const privateStorage = (storage as any).storage;
      const storedItem = privateStorage.get(key);
      
      expect(storedItem.data).not.toContain('123-45-6789');
      expect(storedItem.data).not.toContain('Patient Name');
      expect(typeof storedItem.data).toBe('string');
    });

    test('should maintain audit log', () => {
      const testData = { name: 'Audit Test' };
      const key = 'audit-test';
      const userId = 'test-user-id';
      
      storage.store(key, testData, userId);
      storage.retrieve(key, userId);
      storage.delete(key, userId);
      
      const auditLog = storage.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      
      const storeEntry = auditLog.find(entry => entry.action === 'STORE');
      const retrieveEntry = auditLog.find(entry => entry.action === 'RETRIEVE');
      const deleteEntry = auditLog.find(entry => entry.action === 'DELETE');
      
      expect(storeEntry).toBeTruthy();
      expect(retrieveEntry).toBeTruthy();
      expect(deleteEntry).toBeTruthy();
    });

    test('should handle corrupted data gracefully', () => {
      const key = 'corrupted-data';
      
      // Manually corrupt data in storage
      const privateStorage = (storage as any).storage;
      privateStorage.set(key, {
        data: 'invalid-base64-data!!!',
        timestamp: Date.now(),
        expiration: Date.now() + 60000,
        accessCount: 0,
        lastAccess: Date.now()
      });
      
      const retrieved = storage.retrieve(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('JSON Export/Import with Real Encryption', () => {
    const testPatients = [
      {
        name: 'John Smith',
        dob: '1980-05-15',
        phone: '(555) 123-4567',
        email: 'john@example.com',
        insurance: 'Blue Cross',
        appointmentTime: '2025-07-01T10:00:00Z',
        status: 'scheduled'
      },
      {
        name: 'Jane Doe',
        dob: '1975-12-22',
        phone: '(555) 987-6543',
        email: 'jane@example.com',
        insurance: 'Aetna',
        appointmentTime: '2025-07-01T11:00:00Z',
        status: 'arrived'
      }
    ];

    const password = 'SecureTestPass123!';
    const sensitiveFields = ['name', 'phone', 'email', 'dob'];

    test('should export data to encrypted JSON blob', async () => {
      // Store test data
      storage.store('patient1', testPatients[0]);
      storage.store('patient2', testPatients[1]);
      
      const blob = await storage.exportToJSON(password, sensitiveFields);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(0);
      
      // Verify the JSON structure
      const text = await blob.text();
      const exportData = JSON.parse(text);
      
      expect(exportData.version).toBe('1.0');
      expect(exportData.data).toBeDefined();
      expect(exportData.checksum).toBeDefined();
      expect(exportData.encryptedFields).toEqual(expect.arrayContaining(sensitiveFields));
    });

    test('should import data from encrypted JSON blob', async () => {
      // First export some data
      storage.store('original1', testPatients[0]);
      storage.store('original2', testPatients[1]);
      
      const exportBlob = await storage.exportToJSON(password, sensitiveFields);
      
      // Clear storage and import
      storage.clearAllData();
      expect(storage.getStats().itemCount).toBe(0);
      
      const file = new File([exportBlob], 'test-export.json', { type: 'application/json' });
      const importResult = await storage.importFromJSON(file, password);
      
      expect(importResult.success).toBe(true);
      expect(importResult.imported).toBe(2);
      expect(importResult.errors).toHaveLength(0);
      
      // Verify imported data
      const imported1 = storage.retrieve('original1');
      const imported2 = storage.retrieve('original2');
      
      expect(imported1).toEqual(testPatients[0]);
      expect(imported2).toEqual(testPatients[1]);
    });

    test('should handle export/import cycle without data loss', async () => {
      // Store complex nested data
      const complexData = {
        patientInfo: {
          name: 'Test Patient',
          dob: '1990-01-01',
          contact: {
            phone: '(555) 111-2222',
            email: 'test@example.com'
          }
        },
        appointments: [
          { date: '2025-07-01', time: '10:00', type: 'checkup' },
          { date: '2025-07-15', time: '14:30', type: 'follow-up' }
        ],
        metadata: {
          created: new Date().toISOString(),
          provider: 'Dr. Smith'
        }
      };
      
      storage.store('complex-data', complexData);
      
      // Export
      const exportBlob = await storage.exportToJSON(password, sensitiveFields);
      
      // Import to new storage instance
      const newStorage = new SecureStorage();
      const file = new File([exportBlob], 'complex-test.json', { type: 'application/json' });
      const importResult = await newStorage.importFromJSON(file, password);
      
      expect(importResult.success).toBe(true);
      
      const importedData = newStorage.retrieve('complex-data');
      expect(importedData).toEqual(complexData);
      
      newStorage.destroy();
    });

    test('should fail import with wrong password', async () => {
      storage.store('secret-data', { secret: 'top secret' });
      
      const exportBlob = await storage.exportToJSON(password, sensitiveFields);
      const file = new File([exportBlob], 'secret.json', { type: 'application/json' });
      
      const importResult = await storage.importFromJSON(file, 'wrong-password');
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors.length).toBeGreaterThan(0);
    });

    test('should validate checksum during import', async () => {
      storage.store('data-for-checksum', { value: 'checksum test' });
      
      const exportBlob = await storage.exportToJSON(password, sensitiveFields);
      let exportText = await exportBlob.text();
      
      // Tamper with the data
      const exportData = JSON.parse(exportText);
      exportData.data['data-for-checksum'].data.value = 'tampered data';
      exportText = JSON.stringify(exportData);
      
      const tamperedFile = new File([exportText], 'tampered.json', { type: 'application/json' });
      const importResult = await storage.importFromJSON(tamperedFile, password, undefined, {
        validateChecksum: true
      });
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors).toContain(expect.stringContaining('Checksum validation failed'));
    });

    test('should handle overwrite options correctly', async () => {
      // Initial data
      storage.store('existing-key', { original: 'data' });
      
      // Export
      const exportBlob = await storage.exportToJSON(password, sensitiveFields);
      
      // Modify data and try import without overwrite
      storage.store('existing-key', { modified: 'data' });
      
      const file = new File([exportBlob], 'overwrite-test.json', { type: 'application/json' });
      const importResult1 = await storage.importFromJSON(file, password, undefined, {
        overwrite: false
      });
      
      expect(importResult1.success).toBe(false);
      expect(importResult1.errors).toContain(expect.stringContaining('already exists'));
      
      // Now try with overwrite enabled
      const importResult2 = await storage.importFromJSON(file, password, undefined, {
        overwrite: true
      });
      
      expect(importResult2.success).toBe(true);
      
      const finalData = storage.retrieve('existing-key');
      expect(finalData).toEqual({ original: 'data' });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Patient ${i}`,
        data: `Large data chunk ${'x'.repeat(1000)} for patient ${i}`
      }));
      
      const startTime = Date.now();
      
      // Store all data
      largeDataset.forEach((item, index) => {
        storage.store(`patient-${index}`, item);
      });
      
      const storeTime = Date.now() - startTime;
      expect(storeTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Export
      const exportStart = Date.now();
      const exportBlob = await storage.exportToJSON('test-password', ['name']);
      const exportTime = Date.now() - exportStart;
      
      expect(exportTime).toBeLessThan(10000); // Should export within 10 seconds
      expect(exportBlob.size).toBeGreaterThan(100000); // Should be substantial size
    });

    test('should handle empty data gracefully', async () => {
      const emptyBlob = await storage.exportToJSON('password', []);
      expect(emptyBlob.size).toBeGreaterThan(0); // Still produces valid JSON structure
      
      const file = new File([emptyBlob], 'empty.json', { type: 'application/json' });
      const importResult = await storage.importFromJSON(file, 'password');
      
      expect(importResult.success).toBe(true);
      expect(importResult.imported).toBe(0);
    });

    test('should handle malformed JSON gracefully', async () => {
      const malformedJSON = '{ "invalid": json, "missing": }';
      const file = new File([malformedJSON], 'malformed.json', { type: 'application/json' });
      
      const importResult = await storage.importFromJSON(file, 'password');
      
      expect(importResult.success).toBe(false);
      expect(importResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check and Statistics', () => {
    test('should provide accurate statistics', () => {
      const testData1 = { name: 'Stats Test 1' };
      const testData2 = { name: 'Stats Test 2', moreData: 'additional content' };
      
      storage.store('stats1', testData1);
      storage.store('stats2', testData2);
      
      const stats = storage.getStats();
      
      expect(stats.itemCount).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.auditLogSize).toBeGreaterThan(0);
      expect(stats.oldestItem).toBeLessThanOrEqual(stats.newestItem);
    });

    test('should report healthy status normally', () => {
      storage.store('health-test', { healthy: true });
      
      const health = storage.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.message).toContain('normally');
      expect(health.stats).toBeDefined();
    });

    test('should report warning status with many items', () => {
      // Simulate high item count by directly manipulating stats
      const manyItems = Array.from({ length: 1500 }, (_, i) => ({ id: i }));
      manyItems.forEach((item, index) => {
        storage.store(`item-${index}`, item);
      });
      
      const health = storage.healthCheck();
      
      expect(health.status).toBe('warning');
      expect(health.message).toContain('High number');
    });
  });

  describe('Global Instance', () => {
    test('should provide working global instance', () => {
      const testData = { global: 'test' };
      
      const stored = secureStorage.store('global-test', testData);
      expect(stored).toBe(true);
      
      const retrieved = secureStorage.retrieve('global-test');
      expect(retrieved).toEqual(testData);
      
      secureStorage.delete('global-test');
    });
  });

  describe('Memory Management', () => {
    test('should clean up on destroy', () => {
      storage.store('cleanup-test', { data: 'to cleanup' });
      
      const statsBefore = storage.getStats();
      expect(statsBefore.itemCount).toBe(1);
      
      storage.destroy();
      
      const statsAfter = storage.getStats();
      expect(statsAfter.itemCount).toBe(0);
      expect(statsAfter.auditLogSize).toBe(0);
    });

    test('should handle cleanup interval correctly', (done) => {
      // Create storage with short cleanup interval
      const quickCleanup = new SecureStorage({
        expirationTime: 50, // 50ms expiration
        enableAuditLogging: true
      });
      
      quickCleanup.store('quick-expire', { expires: 'soon' });
      
      // Use real timers for this test
      jest.useRealTimers();
      setTimeout(() => {
        const stats = quickCleanup.getStats();
        expect(stats.itemCount).toBe(0); // Should be cleaned up
        quickCleanup.destroy();
        jest.useFakeTimers();
        done();
      }, 100);
    }, 10000); // 10 second timeout
  });
});