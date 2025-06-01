import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PatientEncryptionService } from '../patientEncryptionService';
import { Patient } from '../../../types';

describe('PatientEncryptionService', () => {
  const testPatient: Patient = {
    id: '12345',
    name: 'John Doe',
    dob: '1980-01-01',
    appointmentTime: '2025-05-20T09:00:00',
    appointmentType: 'Office Visit',
    status: 'scheduled',
    provider: 'Dr. Smith',
    checkInTime: undefined,
    room: undefined
  };

  beforeEach(() => {
    process.env.REACT_APP_PATIENT_ENCRYPTION_KEY = 'test-encryption-key-123';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.REACT_APP_PATIENT_ENCRYPTION_KEY;
  });

  describe('Value encryption/decryption', () => {
    it('should encrypt and decrypt a string value', () => {
      const originalValue = 'sensitive data';
      
      const encryptedValue = PatientEncryptionService.encryptValue(originalValue);
      
      expect(encryptedValue).not.toEqual(originalValue);
      
      const decryptedValue = PatientEncryptionService.decryptValue(encryptedValue);
      
      expect(decryptedValue).toEqual(originalValue);
    });

    it('should use the encryption key from environment variables', () => {
      process.env.REACT_APP_PATIENT_ENCRYPTION_KEY = 'specific-test-key';
      
      const originalValue = 'test data';
      const encryptedValue1 = PatientEncryptionService.encryptValue(originalValue);
      
      process.env.REACT_APP_PATIENT_ENCRYPTION_KEY = 'different-test-key';
      
      const encryptedValue2 = PatientEncryptionService.encryptValue(originalValue);
      
      expect(encryptedValue1).not.toEqual(encryptedValue2);
      
      const decryptedValue = PatientEncryptionService.decryptValue(encryptedValue2);
      expect(decryptedValue).toEqual(originalValue);
    });
  });

  describe('Patient data encryption/decryption', () => {
    it('should encrypt sensitive patient fields', () => {
      const encryptedPatient = PatientEncryptionService.encryptPatient(testPatient);
      
      expect(encryptedPatient.name).not.toEqual(testPatient.name);
      expect(encryptedPatient.dob).not.toEqual(testPatient.dob);
      
      expect(encryptedPatient.id).toEqual(testPatient.id);
      expect(encryptedPatient.appointmentTime).toEqual(testPatient.appointmentTime);
      expect(encryptedPatient.status).toEqual(testPatient.status);
    });

    it('should decrypt encrypted patient data correctly', () => {
      const encryptedPatient = PatientEncryptionService.encryptPatient(testPatient);
      const decryptedPatient = PatientEncryptionService.decryptPatient(encryptedPatient);
      
      expect(decryptedPatient).toEqual(testPatient);
    });

    it('should handle an array of patients', () => {
      const patients = [
        testPatient,
        {
          ...testPatient,
          id: '67890',
          name: 'Jane Smith',
          dob: '1985-05-15'
        }
      ];
      
      const encryptedPatients = PatientEncryptionService.encryptPatients(patients);
      
      encryptedPatients.forEach((patient, index) => {
        expect(patient.name).not.toEqual(patients[index].name);
        expect(patient.dob).not.toEqual(patients[index].dob);
      });
      
      const decryptedPatients = PatientEncryptionService.decryptPatients(encryptedPatients);
      
      expect(decryptedPatients).toEqual(patients);
    });
  });
});
