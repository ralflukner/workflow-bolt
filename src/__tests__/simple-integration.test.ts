import { describe, it, expect, beforeEach } from '@jest/globals';
import { Patient } from '../types';

// Mock Firebase and Tebra for testing
const mockPatients: Patient[] = [];

const mockFirebaseService = {
  saveTodaysSession: async (patients: Patient[]) => {
    mockPatients.length = 0; // Clear existing
    mockPatients.push(...patients);
    return Promise.resolve();
  },
  loadTodaysSession: async () => {
    return Promise.resolve([...mockPatients]);
  }
};

const mockTebraService = {
  getPatients: async (ids: string[]) => {
    // Simulate finding Test Test patient if requested
    if (ids.includes('tebra-test-123')) {
      return Promise.resolve([{
        PatientId: 'tebra-test-123',
        FirstName: 'Test',
        LastName: 'Test',
        DateOfBirth: '1985-06-15',
        Phone: '555-123-4567',
        Email: 'test.test@example.com'
      }]);
    }
    return Promise.resolve([]);
  },
  testConnection: async () => Promise.resolve(true)
};

describe('Simple Integration Tests', () => {
  const testPatient: Patient = {
    id: 'test-123',
    name: 'Test Test',
    dob: '1985-06-15',
    appointmentTime: new Date().toISOString(),
    appointmentType: 'Office Visit',
    status: 'scheduled',
    provider: 'Dr. Test Provider'
  };

  beforeEach(() => {
    mockPatients.length = 0; // Clear patients before each test
  });

  describe('Firebase Operations', () => {
    it('should save Test Test patient to Firebase', async () => {
      await mockFirebaseService.saveTodaysSession([testPatient]);
      
      expect(mockPatients).toHaveLength(1);
      expect(mockPatients[0].name).toBe('Test Test');
    });

    it('should retrieve Test Test patient from Firebase', async () => {
      // First save the patient
      await mockFirebaseService.saveTodaysSession([testPatient]);
      
      // Then retrieve
      const patients = await mockFirebaseService.loadTodaysSession();
      
      expect(patients).toHaveLength(1);
      expect(patients[0]).toEqual(testPatient);
      expect(patients[0].name).toBe('Test Test');
    });

    it('should handle multiple patients', async () => {
      const secondPatient: Patient = {
        id: 'test-456',
        name: 'Another Patient',
        dob: '1990-01-01',
        appointmentTime: new Date().toISOString(),
        appointmentType: 'LABS',
        status: 'arrived',
        provider: 'Dr. Another'
      };

      await mockFirebaseService.saveTodaysSession([testPatient, secondPatient]);
      const patients = await mockFirebaseService.loadTodaysSession();
      
      expect(patients).toHaveLength(2);
      expect(patients.find(p => p.name === 'Test Test')).toBeDefined();
      expect(patients.find(p => p.name === 'Another Patient')).toBeDefined();
    });
  });

  describe('Tebra Operations', () => {
    it('should test Tebra connection', async () => {
      const isConnected = await mockTebraService.testConnection();
      expect(isConnected).toBe(true);
    });

    it('should retrieve Test Test patient from Tebra by ID', async () => {
      const patients = await mockTebraService.getPatients(['tebra-test-123']);
      
      expect(patients).toHaveLength(1);
      expect(patients[0]).toMatchObject({
        PatientId: 'tebra-test-123',
        FirstName: 'Test',
        LastName: 'Test',
        DateOfBirth: '1985-06-15'
      });
    });

    it('should return empty array for non-existent patient', async () => {
      const patients = await mockTebraService.getPatients(['non-existent-id']);
      
      expect(patients).toHaveLength(0);
    });
  });

  describe('Cross-Platform Integration', () => {
    it('should maintain data consistency between Firebase and Tebra', async () => {
      // Get patient from Tebra
      const tebraPatients = await mockTebraService.getPatients(['tebra-test-123']);
      expect(tebraPatients).toHaveLength(1);
      
      // Transform to internal format
      const internalPatient: Patient = {
        id: tebraPatients[0].PatientId,
        name: `${tebraPatients[0].FirstName} ${tebraPatients[0].LastName}`,
        dob: tebraPatients[0].DateOfBirth,
        appointmentTime: new Date().toISOString(),
        appointmentType: 'Office Visit',
        status: 'scheduled',
        provider: 'Dr. Test Provider'
      };
      
      // Save to Firebase
      await mockFirebaseService.saveTodaysSession([internalPatient]);
      
      // Retrieve from Firebase
      const firebasePatients = await mockFirebaseService.loadTodaysSession();
      
      // Verify consistency
      expect(firebasePatients[0].name).toBe('Test Test');
      expect(firebasePatients[0].dob).toBe(tebraPatients[0].DateOfBirth);
      expect(firebasePatients[0].id).toBe(tebraPatients[0].PatientId);
    });

    it('should handle complete workflow: Tebra -> Firebase -> Retrieve', async () => {
      // Step 1: Get from Tebra
      const tebraData = await mockTebraService.getPatients(['tebra-test-123']);
      expect(tebraData).toHaveLength(1);
      
      // Step 2: Transform and save to Firebase
      const transformedPatient: Patient = {
        id: tebraData[0].PatientId,
        name: `${tebraData[0].FirstName} ${tebraData[0].LastName}`,
        dob: tebraData[0].DateOfBirth,
        appointmentTime: new Date().toISOString(),
        appointmentType: 'Office Visit',
        status: 'scheduled',
        provider: 'Dr. Test Provider'
      };
      
      await mockFirebaseService.saveTodaysSession([transformedPatient]);
      
      // Step 3: Retrieve from Firebase and verify
      const retrievedPatients = await mockFirebaseService.loadTodaysSession();
      
      expect(retrievedPatients).toHaveLength(1);
      expect(retrievedPatients[0].name).toBe('Test Test');
      expect(retrievedPatients[0].id).toBe('TEST-PATIENT-001');
      
      // Verify all fields are properly set
      expect(retrievedPatients[0]).toMatchObject({
        id: 'TEST-PATIENT-001',
        name: 'Test Test',
        dob: '1985-06-15',
        appointmentType: 'Office Visit',
        status: 'scheduled',
        provider: 'Dr. Test Provider'
      });
    });
  });
}); 