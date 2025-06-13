import axios from 'axios';
import { TebraCredentials, TebraPatient, TebraAppointment } from './tebra-api-service.types';
import { Patient } from '../types';
import { TebraDataTransformer } from './tebra-data-transformer';

export class TebraCloudService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
      });
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Tebra Cloud service:', error);
      return false;
    }
  }

  async getAppointments(fromDate: Date, toDate: Date): Promise<TebraAppointment[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/appointments`, {
        headers: this.getHeaders(),
        params: {
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      throw error;
    }
  }

  async getPatients(patientIds: string[]): Promise<TebraPatient[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/patients/batch`,
        { patientIds },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      throw error;
    }
  }

  async getProviders(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/providers`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      throw error;
    }
  }

  async transformAndSavePatients(
    appointments: TebraAppointment[],
    patients: TebraPatient[]
  ): Promise<Patient[]> {
    const internalPatients: Patient[] = [];
    
    for (const appointment of appointments) {
      const patient = patients.find((p) => p.PatientId === appointment.PatientId);
      if (patient) {
        try {
          const internalPatient = TebraDataTransformer.combineToInternalPatient(
            patient,
            appointment
          );
          internalPatients.push(internalPatient);
        } catch (error) {
          console.error(`Failed to transform patient ${patient.FirstName} ${patient.LastName}:`, error);
        }
      }
    }

    return internalPatients;
  }
} 