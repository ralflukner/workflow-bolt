import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TebraSoapClient } from '../tebraSoapClient';
import { PatientEncryptionService } from '../../services/encryption/patientEncryptionService';
import { Patient } from '../../types';

jest.mock('soap', () => {
  return {
    createClientAsync: jest.fn().mockResolvedValue({
      GetPatientAsync: jest.fn().mockResolvedValue([{ patient: { id: '123', name: 'Test Patient', dob: '1980-01-01' } }]),
      GetAppointmentsAsync: jest.fn().mockResolvedValue([{ 
        appointments: [
          { id: 'appt1', patientId: '123', date: '2025-05-20', time: '09:00', status: 'Confirmed' },
          { id: 'appt2', patientId: '456', date: '2025-05-20', time: '10:30', status: 'Scheduled' }
        ] 
      }]),
      setSecurity: jest.fn()
    }),
    BasicAuthSecurity: jest.fn()
  };
});

describe('Tebra Integration with Encryption', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_TEBRA_USERNAME = 'test-username';
    process.env.REACT_APP_TEBRA_PASSWORD = 'test-password';
    process.env.REACT_APP_TEBRA_WSDL_URL = 'https://test.example.com/wsdl';
    process.env.REACT_APP_PATIENT_ENCRYPTION_KEY = 'test-encryption-key-123';
  });

  afterEach(() => {
    delete process.env.REACT_APP_TEBRA_USERNAME;
    delete process.env.REACT_APP_TEBRA_PASSWORD;
    delete process.env.REACT_APP_TEBRA_WSDL_URL;
    delete process.env.REACT_APP_PATIENT_ENCRYPTION_KEY;
  });

  describe('Secure credential handling', () => {
    it('should use environment variables for credentials', async () => {
      const client = new TebraSoapClient();
      
      const config = client['config'];
      
      expect(config.username).toBe('test-username');
      expect(config.password).toBe('test-password');
      expect(config.wsdlUrl).toBe('https://test.example.com/wsdl');
    });

    it('should fall back to demo values if environment variables are not set', async () => {
      delete process.env.REACT_APP_TEBRA_USERNAME;
      delete process.env.REACT_APP_TEBRA_PASSWORD;
      delete process.env.REACT_APP_TEBRA_WSDL_URL;
      
      const client = new TebraSoapClient();
      
      const config = client['config'];
      
      expect(config.username).toBe('demo');
      expect(config.password).toBe('demo');
      expect(config.wsdlUrl).toBe('https://example.com/tebra.wsdl');
    });
  });

  describe('Patient data encryption', () => {
    it('should encrypt and decrypt patient data correctly', async () => {
      const testPatient: Patient = {
        id: '12345',
        name: 'John Doe',
        dob: '1980-01-01',
        appointmentTime: '2025-05-20T09:00:00',
        status: 'Confirmed',
        provider: 'Dr. Smith',
        room: undefined,
        checkInTime: undefined
      };
      
      const encryptedPatient = PatientEncryptionService.encryptPatient(testPatient);
      
      expect(encryptedPatient.name).not.toEqual(testPatient.name);
      expect(encryptedPatient.dob).not.toEqual(testPatient.dob);
      
      const decryptedPatient = PatientEncryptionService.decryptPatient(encryptedPatient);
      
      expect(decryptedPatient).toEqual(testPatient);
    });

    it('should handle an array of patients from Tebra API', async () => {
      const tebraPatients = [
        {
          id: '123',
          name: 'Test Patient',
          dob: '1980-01-01',
          appointmentTime: '2025-05-20T09:00:00',
          status: 'Confirmed',
          provider: 'Dr. Smith'
        },
        {
          id: '456',
          name: 'Another Patient',
          dob: '1985-05-15',
          appointmentTime: '2025-05-20T10:30:00',
          status: 'Scheduled',
          provider: 'Dr. Jones'
        }
      ] as Patient[];
      
      const encryptedPatients = PatientEncryptionService.encryptPatients(tebraPatients);
      
      encryptedPatients.forEach((patient, index) => {
        expect(patient.name).not.toEqual(tebraPatients[index].name);
        expect(patient.dob).not.toEqual(tebraPatients[index].dob);
      });
      
      const decryptedPatients = PatientEncryptionService.decryptPatients(encryptedPatients);
      
      expect(decryptedPatients).toEqual(tebraPatients);
    });
  });

  describe('End-to-end Tebra integration with encryption', () => {
    it('should retrieve and encrypt appointment data', async () => {
      const client = new TebraSoapClient();
      
      const appointments = await client.getAppointments('2025-05-20', '2025-05-20');
      
      const patients = (appointments as any[]).map(appt => ({
        id: appt.patientId || 'unknown',
        name: `Patient ${appt.patientId}`,
        dob: '1980-01-01', // Mock DOB
        appointmentTime: `${appt.date}T${appt.time}:00`,
        status: appt.status,
        provider: 'Dr. Test'
      })) as Patient[];
      
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
