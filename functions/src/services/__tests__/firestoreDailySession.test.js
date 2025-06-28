const { firestoreDailySessionRepo } = require('../firestoreDailySession');
const admin = require('firebase-admin');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'TIMESTAMP_MOCK')
  }
}));

describe('firestoreDailySessionRepo', () => {
  let mockDb, mockBatch, mockCollection, mockDoc, mockSubCollection;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore batch operations
    mockBatch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue()
    };

    // Mock subcollection
    mockSubCollection = {
      doc: jest.fn().mockReturnValue({
        // This will be used for batch.set()
      })
    };

    // Mock document reference
    mockDoc = {
      collection: jest.fn().mockReturnValue(mockSubCollection)
    };

    // Mock collection reference
    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc)
    };

    // Mock Firestore database
    mockDb = {
      batch: jest.fn().mockReturnValue(mockBatch),
      collection: jest.fn().mockReturnValue(mockCollection),
      settings: jest.fn()
    };

    admin.firestore.mockReturnValue(mockDb);
  });

  describe('save', () => {
    const testDate = '2024-01-15';
    const testUid = 'test-user-123';
    const testPatients = [
      {
        id: 'patient-1',
        name: 'John Doe',
        appointmentTime: '2024-01-15T09:00:00',
        status: 'Confirmed'
      },
      {
        id: 'patient-2',
        name: 'Jane Smith',
        appointmentTime: '2024-01-15T10:00:00',
        status: 'Scheduled'
      }
    ];

    it('should save patients data successfully', async () => {
      await firestoreDailySessionRepo.save(testDate, testPatients, testUid);

      // Verify collection and document references
      expect(mockDb.collection).toHaveBeenCalledWith('daily_sessions');
      expect(mockCollection.doc).toHaveBeenCalledWith(testDate);

      // Verify root document is set with metadata and patients array
      expect(mockBatch.set).toHaveBeenCalledWith(
        mockDoc,
        {
          date: testDate,
          patients: testPatients,
          lastSync: 'TIMESTAMP_MOCK',
          syncedBy: testUid
        },
        { merge: true }
      );

      // Verify each patient is stored in subcollection
      expect(mockDoc.collection).toHaveBeenCalledWith('patients');
      expect(mockSubCollection.doc).toHaveBeenCalledWith('patient-1');
      expect(mockSubCollection.doc).toHaveBeenCalledWith('patient-2');

      // Verify batch operations
      expect(mockBatch.set).toHaveBeenCalledTimes(3); // 1 root + 2 patients
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle empty patients array', async () => {
      await firestoreDailySessionRepo.save(testDate, [], testUid);

      // Should still create root document
      expect(mockBatch.set).toHaveBeenCalledWith(
        mockDoc,
        {
          date: testDate,
          patients: [],
          lastSync: 'TIMESTAMP_MOCK',
          syncedBy: testUid
        },
        { merge: true }
      );

      expect(mockBatch.set).toHaveBeenCalledTimes(1); // Only root document
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should use Firestore emulator settings when configured', async () => {
      const originalHost = process.env.FIRESTORE_EMULATOR_HOST;
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

      await firestoreDailySessionRepo.save(testDate, testPatients, testUid);

      expect(mockDb.settings).toHaveBeenCalledWith({
        host: 'localhost:8080',
        ssl: false
      });

      // Restore original environment
      if (originalHost) {
        process.env.FIRESTORE_EMULATOR_HOST = originalHost;
      } else {
        delete process.env.FIRESTORE_EMULATOR_HOST;
      }
    });

    it('should not configure emulator settings in production', async () => {
      delete process.env.FIRESTORE_EMULATOR_HOST;

      await firestoreDailySessionRepo.save(testDate, testPatients, testUid);

      expect(mockDb.settings).not.toHaveBeenCalled();
    });

    it('should handle batch size limits with multiple commits', async () => {
      // Create 502 patients to exceed the 500 batch limit
      const manyPatients = Array.from({ length: 502 }, (_, i) => ({
        id: `patient-${i}`,
        name: `Patient ${i}`,
        status: 'Scheduled'
      }));

      // Mock batch.commit to track calls
      let batchCommitCount = 0;
      mockBatch.commit.mockImplementation(() => {
        batchCommitCount++;
        return Promise.resolve();
      });

      // Mock db.batch to return new batch instances
      let batchCreateCount = 0;
      mockDb.batch.mockImplementation(() => {
        batchCreateCount++;
        return {
          set: jest.fn(),
          commit: jest.fn().mockImplementation(() => {
            return Promise.resolve();
          })
        };
      });

      await firestoreDailySessionRepo.save(testDate, manyPatients, testUid);

      // Should create multiple batches due to 500 operation limit
      // 1 root doc + 502 patients = 503 operations total
      // First batch: 500 operations, Second batch: 3 operations
      expect(batchCreateCount).toBeGreaterThan(1);
    });

    it('should handle Firestore errors gracefully', async () => {
      const firestoreError = new Error('Firestore operation failed');
      mockBatch.commit.mockRejectedValue(firestoreError);

      await expect(
        firestoreDailySessionRepo.save(testDate, testPatients, testUid)
      ).rejects.toThrow('Firestore operation failed');
    });

    it('should handle patients with missing IDs', async () => {
      const patientsWithMissingId = [
        {
          id: 'patient-1',
          name: 'John Doe'
        },
        {
          // Missing ID - should still work but might cause issues
          name: 'Jane Smith'
        }
      ];

      await firestoreDailySessionRepo.save(testDate, patientsWithMissingId, testUid);

      // Should still attempt to save both patients
      expect(mockBatch.set).toHaveBeenCalledTimes(3); // 1 root + 2 patients
    });

    it('should use merge option to prevent overwriting existing data', async () => {
      await firestoreDailySessionRepo.save(testDate, testPatients, testUid);

      // Verify merge option is used for root document
      expect(mockBatch.set).toHaveBeenCalledWith(
        mockDoc,
        expect.any(Object),
        { merge: true }
      );

      // Verify merge option is used for patient documents
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.any(Object), // patient doc reference
        testPatients[0],
        { merge: true }
      );
    });

    it('should handle large patient datasets efficiently', async () => {
      // Create a large dataset to test performance
      const largePatientSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `patient-${i}`,
        name: `Patient ${i}`,
        appointmentTime: `2024-01-15T${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
        status: i % 3 === 0 ? 'Confirmed' : i % 3 === 1 ? 'Scheduled' : 'Cancelled'
      }));

      // Mock performance timing
      const startTime = Date.now();
      
      await firestoreDailySessionRepo.save(testDate, largePatientSet, testUid);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second for mocked operations
    });
  });

  describe('Error Scenarios', () => {
    it('should handle database connection errors', async () => {
      admin.firestore.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(
        firestoreDailySessionRepo.save('2024-01-15', [], 'test-user')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle batch creation errors', async () => {
      mockDb.batch.mockImplementation(() => {
        throw new Error('Failed to create batch');
      });

      await expect(
        firestoreDailySessionRepo.save('2024-01-15', [], 'test-user')
      ).rejects.toThrow('Failed to create batch');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all patient data fields', async () => {
      const detailedPatient = {
        id: 'patient-detailed',
        name: 'John Detailed Doe',
        dob: '1990-01-01',
        appointmentTime: '2024-01-15T09:00:00',
        appointmentType: 'Annual Checkup',
        provider: 'Dr. Smith',
        status: 'Confirmed',
        phone: '555-0123',
        email: 'john.doe@example.com',
        insurance: 'Blue Cross',
        notes: 'First time patient'
      };

      await firestoreDailySessionRepo.save('2024-01-15', [detailedPatient], 'test-user');

      // Verify all fields are preserved in the patients array
      expect(mockBatch.set).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining({
          patients: [detailedPatient]
        }),
        { merge: true }
      );

      // Verify all fields are preserved in subcollection
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.any(Object),
        detailedPatient,
        { merge: true }
      );
    });
  });
});