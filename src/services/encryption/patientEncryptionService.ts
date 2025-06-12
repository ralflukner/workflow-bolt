import CryptoJS from 'crypto-js';
import { Patient } from '../../types';
import { secretsService } from '../secretsService';

/**
 * HIPAA-Compliant Patient Data Encryption Service
 * Uses Google Secret Manager for secure key management
 */
export class PatientEncryptionService {

  /**
   * Get encryption key from Google Secret Manager or environment variables
   */
  private static async getEncryptionKey(): Promise<string> {
    return await secretsService.getSecret('PATIENT_ENCRYPTION_KEY');
  }

  /**
   * Synchronous wrapper for getEncryptionKey
   */
  private static getEncryptionKeySync(): string {
    return secretsService.getSecretSync('PATIENT_ENCRYPTION_KEY');
  }

  /**
   * Encrypt a string value using AES encryption
   */
  static encryptValue(value: string): string {
    const key = this.getEncryptionKeySync();
    return CryptoJS.AES.encrypt(value, key).toString();
  }

  /**
   * Decrypt an encrypted string value
   */
  static decryptValue(encryptedValue: string): string {
    const key = this.getEncryptionKeySync();
    const bytes = CryptoJS.AES.decrypt(encryptedValue, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Async version of encryptValue for when secret manager is needed
   */
  static async encryptValueAsync(value: string): Promise<string> {
    const key = await this.getEncryptionKey();
    return CryptoJS.AES.encrypt(value, key).toString();
  }

  /**
   * Async version of decryptValue for when secret manager is needed
   */
  static async decryptValueAsync(encryptedValue: string): Promise<string> {
    const key = await this.getEncryptionKey();
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
