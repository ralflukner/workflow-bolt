import CryptoJS from 'crypto-js';
import { Patient } from '../../types';

/**
 * Service for encrypting and decrypting patient data for HIPAA compliance
 * Handles secure encryption of sensitive patient information at rest
 */
export class PatientEncryptionService {
  /**
   * Get the encryption key from environment variables
   * In production, this should use a secure key management system
   */
  private static getEncryptionKey(): string {
    if (process.env.NODE_ENV === 'test') {
      const testKey = process.env.REACT_APP_PATIENT_ENCRYPTION_KEY;
      if (!testKey) {
        throw new Error('Missing encryption key in test environment. Set REACT_APP_PATIENT_ENCRYPTION_KEY.');
      }
      return testKey;
    }
    
    // In production, this should use a secure key management system
    try {
      const envKey = typeof process !== 'undefined' && process.env?.REACT_APP_PATIENT_ENCRYPTION_KEY;
      
      if (!envKey) {
        throw new Error('Missing encryption key. Set REACT_APP_PATIENT_ENCRYPTION_KEY environment variable.');
      }
      
      return envKey;
    } catch (error) {
      console.error('Error retrieving encryption key:', error);
      throw new Error('Failed to retrieve encryption key. Ensure REACT_APP_PATIENT_ENCRYPTION_KEY is set.');
    }
  }

  /**
   * Encrypt a string value using AES encryption
   */
  static encryptValue(value: string): string {
    const key = this.getEncryptionKey();
    return CryptoJS.AES.encrypt(value, key).toString();
  }

  /**
   * Decrypt an encrypted string value
   */
  static decryptValue(encryptedValue: string): string {
    const key = this.getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedValue, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Encrypt sensitive patient data fields
   * Only encrypts fields containing PHI (Protected Health Information)
   */
  static encryptPatient(patient: Patient): Patient {
    return {
      ...patient,
      name: this.encryptValue(patient.name),
      dob: this.encryptValue(patient.dob),
    };
  }

  /**
   * Decrypt sensitive patient data fields
   */
  static decryptPatient(encryptedPatient: Patient): Patient {
    return {
      ...encryptedPatient,
      name: this.decryptValue(encryptedPatient.name),
      dob: this.decryptValue(encryptedPatient.dob),
    };
  }

  /**
   * Encrypt an array of patients
   */
  static encryptPatients(patients: Patient[]): Patient[] {
    return patients.map(patient => this.encryptPatient(patient));
  }

  /**
   * Decrypt an array of patients
   */
  static decryptPatients(encryptedPatients: Patient[]): Patient[] {
    return encryptedPatients.map(patient => this.decryptPatient(patient));
  }
}
