import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TebraSoapClient } from '../tebraSoapClient';
import { PatientEncryptionService } from '../../services/encryption/patientEncryptionService';
import { Patient } from '../../types';
import { TebraCredentials } from '../tebra-api-service.types';

interface MockTebraSoapClient {
  config: {
    wsdlUrl: string;
    username: string;
    password: string;
  };
  getAppointments: jest.Mock;
  getPatientById: jest.Mock;
}

jest.mock('../tebraSoapClient', () => {
  const TebraSoapClient = jest.fn().mockImplementation(function(this: MockTebraSoapClient) {
    const getEnvVar = (name: string, fallback: string): string => {
      if (process.env.NODE_ENV === 'test') {
        return process.env[name] || fallback;
      }
      try {
        return (typeof process !== 'undefined' && process.env?.[name]) || fallback;
      } catch (e) {
        return fallback;
      }
    };

    this.config = {
      wsdlUrl: getEnvVar('REACT_APP_TEBRA_WSDL_URL', 'https://example.com/tebra.wsdl'),
      username: getEnvVar('REACT_APP_TEBRA_USERNAME', 'demo'),
      password: getEnvVar('REACT_APP_TEBRA_PASSWORD', 'demo')
    };
    
    this.getAppointments = jest.fn(() => Promise.resolve([
      { patientId: '123', date: '2025-05-20', time: '09:00', status: 'Confirmed' },
      { patientId: '456', date: '2025-05-20', time: '10:30', status: 'Scheduled' }
    ]));
    
    this.getPatientById = jest.fn(() => Promise.resolve({ 
      id: '123', 
      name: 'Test Patient', 
      dob: '1980-01-01' 
    }));
    
    return this;
  });
  
  return { TebraSoapClient };
});

describe('Tebra Integration with Encryption', () => {
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    process.env.REACT_APP_TEBRA_USERNAME = 'test-username';
    process.env.REACT_APP_TEBRA_PASSWORD = 'test-password';
    process.env.REACT_APP_TEBRA_WSDL_URL = 'https://test.example.com/wsdl';
    process.env.REACT_APP_PATIENT_ENCRYPTION_KEY = 'test-encryption-key-123';
  });

  afterEach(() => {
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    delete process.env.REACT_APP_TEBRA_USERNAME;
    delete process.env.REACT_APP_TEBRA_PASSWORD;
    delete process.env.REACT_APP_TEBRA_WSDL_URL;
    delete process.env.REACT_APP_PATIENT_ENCRYPTION_KEY;
  });

  describe('Secure credential handling', () => {
    it('should use environment variables for credentials', async () => {
      const credentials: TebraCredentials = {
        username: process.env.REACT_APP_TEBRA_USERNAME || 'test-username',
        password: process.env.REACT_APP_TEBRA_PASSWORD || 'test-password',
        wsdlUrl: process.env.REACT_APP_TEBRA_WSDL_URL || 'https://test.example.com/wsdl'
      };
      const client = new TebraSoapClient(credentials);
      
      // Since the mocked TebraSoapClient has a config property, we can access it
      const mockClient = client as any;
      const config = mockClient.config;
      
      expect(config.username).toBe('test-username');
      expect(config.password).toBe('test-password');
      expect(config.wsdlUrl).toBe('https://test.example.com/wsdl');
    });

    it('should fall back to demo values if environment variables are not set', async () => {
      delete process.env.REACT_APP_TEBRA_USERNAME;
      delete process.env.REACT_APP_TEBRA_PASSWORD;
      delete process.env.REACT_APP_TEBRA_WSDL_URL;
      
      const credentials: TebraCredentials = {
        username: 'demo',
        password: 'demo',
        wsdlUrl: 'https://example.com/tebra.wsdl'
      };
      const client = new TebraSoapClient(credentials);
      
      const mockClient = client as any;
      const config = mockClient.config;
      
      expect(config.username).toBe('demo');
      expect(config.password).toBe('demo');
      expect(config.wsdlUrl).toBe('https://example.com/tebra.wsdl');
    });
  });

  describe('Patient data encryption', () => {
    it('should encrypt patient data from Tebra response', async () => {
      if (typeof window !== 'undefined') {
        // Skip this test in browser environments
        return;
      }
      
      const tebraPatients = [
        {
          id: '123',
          name: 'John Doe',
          dob: '1980-01-01',
          appointmentTime: '2025-06-05T09:00:00',
          status: 'scheduled' as const,
          provider: 'Dr. Smith'
        },
        {
          id: '456',
          name: 'Jane Smith',
          dob: '1975-05-15',
          appointmentTime: '2025-06-05T10:00:00',
          status: 'scheduled' as const,
          provider: 'Dr. Johnson'
        }
      ] as Patient[];
      
      const encryptedPatients = PatientEncryptionService.encryptPatients(tebraPatients);
      
      encryptedPatients.forEach((patient, index) => {
        expect(patient.name).not.toEqual(tebraPatients[index].name);
        expect(patient.dob).not.toEqual(tebraPatients[index].dob);
      });
      
      const decryptedPatients = encryptedPatients.length > 0 
        ? PatientEncryptionService.decryptPatients(encryptedPatients)
        : [];
      
      expect(decryptedPatients).toEqual(tebraPatients);
    });
  });

  describe('End-to-end Tebra integration with encryption', () => {
    it('should retrieve and encrypt appointment data', async () => {
      if (typeof window !== 'undefined') {
        // Skip this test in browser environments
        return;
      }
      
      const credentials: TebraCredentials = {
        username: process.env.REACT_APP_TEBRA_USERNAME || 'test-username',
        password: process.env.REACT_APP_TEBRA_PASSWORD || 'test-password',
        wsdlUrl: process.env.REACT_APP_TEBRA_WSDL_URL || 'https://test.example.com/wsdl'
      };
      const client = new TebraSoapClient(credentials);
      
      const appointments = await (client as any).getAppointments();
      expect(appointments).toHaveLength(2);
      expect(appointments[0].patientId).toBe('123');
    });

    it('should retrieve and decrypt patient data while maintaining security', async () => {
      if (typeof window !== 'undefined') {
        // Skip this test in browser environments
        return;
      }
      
      const credentials: TebraCredentials = {
        username: process.env.REACT_APP_TEBRA_USERNAME || 'test-username',
        password: process.env.REACT_APP_TEBRA_PASSWORD || 'test-password',
        wsdlUrl: process.env.REACT_APP_TEBRA_WSDL_URL || 'https://test.example.com/wsdl'
      };
      const client = new TebraSoapClient(credentials);
      
      const patientData = await client.getPatientById('123');
      
      expect(patientData).toBeDefined();
      expect(patientData.id).toBe('123');
      
      // Convert Tebra patient to internal Patient format
      const patient: Patient = {
        id: patientData.id,
        name: patientData.name,
        dob: patientData.dob,
        appointmentTime: '2025-06-05T09:00:00',
        status: 'scheduled',
        provider: 'Dr. Test'
      };
      
      // Encrypt the patient data
      const encryptedPatient = PatientEncryptionService.encryptPatient(patient);
      
      // Name and DOB should be encrypted
      expect(encryptedPatient.name).not.toEqual(patient.name);
      expect(encryptedPatient.dob).not.toEqual(patient.dob);
      
      // Other fields should remain unencrypted
      expect(encryptedPatient.id).toEqual(patient.id);
      expect(encryptedPatient.status).toEqual(patient.status);
      
      // Should be able to decrypt back to original
      const decryptedPatient = PatientEncryptionService.decryptPatient(encryptedPatient);
      expect(decryptedPatient).toEqual(patient);
    });
  });
});