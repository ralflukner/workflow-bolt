/**
 * PostgreSQL Service for Patient Data Persistence
 * Replaces Firestore for HIPAA-compliant data storage
 */

import { Patient } from '../../types';

// Define DailySession interface locally until it's moved to types
interface DailySession {
  id: string; // Format: YYYY-MM-DD
  date: string; // ISO date string
  patients: Patient[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface PostgresConfig {
  apiUrl: string;
  getAccessToken: () => Promise<string>;
}

class PostgresService {
  private config: PostgresConfig;

  constructor(config: PostgresConfig) {
    this.config = config;
  }

  /**
   * Get authorization headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.config.getAccessToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Handle API response
   */
  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PostgreSQL API error: ${response.status} - ${error}`);
    }
    return response.json();
  }

  /**
   * Get all patients
   */
  async getPatients(): Promise<Patient[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/patients`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      const data = await this.handleResponse(response);
      return data.patients || [];
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      throw error;
    }
  }

  /**
   * Get a single patient by ID
   */
  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/patients/${patientId}`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      if (response.status === 404) {
        return null;
      }

      const data = await this.handleResponse(response);
      return data.patient;
    } catch (error) {
      console.error(`Failed to fetch patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new patient
   */
  async createPatient(patient: Omit<Patient, 'id'>): Promise<Patient> {
    try {
      const response = await fetch(`${this.config.apiUrl}/patients`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(patient)
      });

      const data = await this.handleResponse(response);
      return data.patient;
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  }

  /**
   * Update an existing patient
   */
  async updatePatient(patientId: string, updates: Partial<Patient>): Promise<Patient> {
    try {
      const response = await fetch(`${this.config.apiUrl}/patients/${patientId}`, {
        method: 'PATCH',
        headers: await this.getHeaders(),
        body: JSON.stringify(updates)
      });

      const data = await this.handleResponse(response);
      return data.patient;
    } catch (error) {
      console.error(`Failed to update patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a patient
   */
  async deletePatient(patientId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/patients/${patientId}`, {
        method: 'DELETE',
        headers: await this.getHeaders()
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete patient: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to delete patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Batch update multiple patients
   */
  async batchUpdatePatients(patients: Patient[]): Promise<Patient[]> {
    try {
      const response = await fetch(`${this.config.apiUrl}/patients/batch`, {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: JSON.stringify({ patients })
      });

      const data = await this.handleResponse(response);
      return data.patients || [];
    } catch (error) {
      console.error('Failed to batch update patients:', error);
      throw error;
    }
  }

  /**
   * Save a daily session
   */
  async saveDailySession(session: DailySession): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/sessions`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(session)
      });

      await this.handleResponse(response);
    } catch (error) {
      console.error('Failed to save daily session:', error);
      throw error;
    }
  }

  /**
   * Get daily sessions for a date range
   */
  async getDailySessions(startDate: string, endDate: string): Promise<DailySession[]> {
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      });

      const response = await fetch(`${this.config.apiUrl}/sessions?${params}`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      const data = await this.handleResponse(response);
      return data.sessions || [];
    } catch (error) {
      console.error('Failed to fetch daily sessions:', error);
      throw error;
    }
  }

  /**
   * Get today's session
   */
  async getTodaysSession(): Promise<DailySession | null> {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await this.getDailySessions(today, today);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Search patients by name or MRN
   */
  async searchPatients(query: string): Promise<Patient[]> {
    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`${this.config.apiUrl}/patients/search?${params}`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      const data = await this.handleResponse(response);
      return data.patients || [];
    } catch (error) {
      console.error('Failed to search patients:', error);
      throw error;
    }
  }

  /**
   * Get patients by status
   */
  async getPatientsByStatus(status: string): Promise<Patient[]> {
    try {
      const params = new URLSearchParams({ status });
      const response = await fetch(`${this.config.apiUrl}/patients?${params}`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      const data = await this.handleResponse(response);
      return data.patients || [];
    } catch (error) {
      console.error(`Failed to fetch patients with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Export patients data
   */
  async exportPatients(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const params = new URLSearchParams({ format });
      const response = await fetch(`${this.config.apiUrl}/patients/export?${params}`, {
        method: 'GET',
        headers: await this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Failed to export patients:', error);
      throw error;
    }
  }

  /**
   * Import patients data
   */
  async importPatients(file: File): Promise<{ imported: number; errors: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.config.apiUrl}/patients/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.config.getAccessToken()}`
          // Don't set Content-Type for FormData
        },
        body: formData
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Failed to import patients:', error);
      throw error;
    }
  }
}

// Export singleton instance (will be initialized in App.tsx)
let postgresService: PostgresService | null = null;

export const initializePostgresService = (config: PostgresConfig) => {
  postgresService = new PostgresService(config);
  return postgresService;
};

export const getPostgresService = (): PostgresService => {
  if (!postgresService) {
    throw new Error('PostgresService not initialized. Call initializePostgresService first.');
  }
  return postgresService;
};

export type { PostgresService, PostgresConfig }; 