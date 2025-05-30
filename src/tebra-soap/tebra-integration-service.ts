import { TebraCredentials, TebraPatient } from './tebra-api-service.types';
import { TebraApiService } from './tebra-api-service';
import { TebraDataTransformer } from './tebra-data-transformer';
import { Patient } from '../types';
import { dailySessionService } from '../services/firebase/dailySessionService';

export interface TebraIntegrationConfig {
  credentials: TebraCredentials;
  syncInterval: number; // minutes
  lookAheadDays: number; // how many days ahead to fetch appointments
  autoSync: boolean;
  fallbackToMockData: boolean;
}

export interface SyncResult {
  success: boolean;
  patientsFound: number;
  appointmentsFound: number;
  errors: string[];
  lastSyncTime: Date;
}

export class TebraIntegrationService {
  private apiService: TebraApiService;
  private config: TebraIntegrationConfig;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private lastSyncResult: SyncResult | null = null;
  private isConnected = false;

  constructor(config: TebraIntegrationConfig) {
    this.config = config;
    this.apiService = new TebraApiService(config.credentials);
  }

  /**
   * Initialize the integration service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Tebra integration...');
      
      // Test API connection
      this.isConnected = await this.apiService.testConnection();
      
      if (!this.isConnected) {
        console.warn('Tebra API connection failed, will use fallback data if enabled');
        if (!this.config.fallbackToMockData) {
          throw new Error('Tebra API connection failed and fallback is disabled');
        }
      }

      // Start auto-sync if enabled
      if (this.config.autoSync && this.isConnected) {
        this.startAutoSync();
      }

      console.log('Tebra integration initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Tebra integration:', error);
      return false;
    }
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    const intervalMs = this.config.syncInterval * 60 * 1000;
    console.log(`Starting auto-sync every ${this.config.syncInterval} minutes`);

    this.syncTimer = setInterval(async () => {
      try {
        await this.syncTodaysSchedule();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, intervalMs);

    // Perform initial sync
    setTimeout(async () => {
      await this.syncTodaysSchedule();
    }, 1000);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('Auto-sync stopped');
    }
  }

  /**
   * Sync today's schedule from Tebra
   */
  async syncTodaysSchedule(): Promise<SyncResult> {
    const startTime = new Date();
    const errors: string[] = [];

    try {
      if (!this.isConnected) {
        throw new Error('Not connected to Tebra API');
      }

      console.log('Syncing today\'s schedule from Tebra...');

      // Define date range (today + look ahead days)
      const fromDate = new Date();
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + this.config.lookAheadDays);
      toDate.setHours(23, 59, 59, 999);

      // Fetch appointments
      const appointments = await this.apiService.getAppointments(fromDate, toDate);
      console.log(`Found ${appointments.length} appointments`);

      if (appointments.length === 0) {
        return {
          success: true,
          patientsFound: 0,
          appointmentsFound: 0,
          errors: [],
          lastSyncTime: startTime,
        };
      }
      // Extract unique patient IDs
      const patientIds = [...new Set(appointments.map((apt: { PatientId: string }) => apt.PatientId))];
      
      // Fetch patient details
      const patients = await this.apiService.getPatients(patientIds);
      console.log(`Found ${patients.length} patients`);

      // Fetch providers
      const providers = await this.apiService.getProviders();
      console.log(`Found ${providers.length} providers`);

      // Transform data to internal format
      const internalPatients: Patient[] = [];
      
      for (const appointment of appointments) {
        const patient = patients.find((p: TebraPatient) => p.PatientId === appointment.PatientId);
        if (patient) {
          try {
            const internalPatient = TebraDataTransformer.combineToInternalPatient(
              appointment, 
              patient, 
              providers
            );
            internalPatients.push(internalPatient);
          } catch (error) {
            errors.push(`Failed to transform patient ${patient.FirstName} ${patient.LastName}: ${error}`);
          }
        } else {
          errors.push(`Patient not found for appointment ${appointment.AppointmentId}`);
        }
      }

      // Save to persistent storage
      if (internalPatients.length > 0) {
        await dailySessionService.saveTodaysSession(internalPatients);
        console.log(`Saved ${internalPatients.length} patients to session storage`);
      }

      this.lastSyncResult = {
        success: true,
        patientsFound: patients.length,
        appointmentsFound: appointments.length,
        errors,
        lastSyncTime: startTime,
      };

      console.log('Schedule sync completed successfully');
      return this.lastSyncResult;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      
      this.lastSyncResult = {
        success: false,
        patientsFound: 0,
        appointmentsFound: 0,
        errors,
        lastSyncTime: startTime,
      };

      console.error('Schedule sync failed:', error);
      return this.lastSyncResult;
    }
  }

  /**
   * Get last sync result
   */
  getLastSyncResult(): SyncResult | null {
    return this.lastSyncResult;
  }

  /**
   * Check if connected to Tebra API
   */
  isApiConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Manually trigger sync
   */
  async forceSync(): Promise<SyncResult> {
    return await this.syncTodaysSchedule();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TebraIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart auto-sync if interval changed
    if (newConfig.syncInterval && this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoSync();
  }
}

/**
 * Integration hook for React components
 */
export class TebraIntegrationHook {
  private static instance: TebraIntegrationService | null = null;
  
  static initialize(config: TebraIntegrationConfig): TebraIntegrationService {
    if (!this.instance) {
      this.instance = new TebraIntegrationService(config);
    }
    return this.instance;
  }
  
  static getInstance(): TebraIntegrationService | null {
    return this.instance;
  }
  
  static cleanup(): void {
    if (this.instance) {
      this.instance.cleanup();
      this.instance = null;
    }
  }
}

// Configuration helper
export const createTebraConfig = (
  credentials: TebraCredentials,
  options: Partial<Omit<TebraIntegrationConfig, 'credentials'>> = {}
): TebraIntegrationConfig => {
  return {
    credentials,
    syncInterval: options.syncInterval || 15, // 15 minutes default
    lookAheadDays: options.lookAheadDays || 1, // 1 day ahead
    autoSync: options.autoSync !== false, // true by default
    fallbackToMockData: options.fallbackToMockData !== false, // true by default
  };
};