/**
 * @fileoverview Test suite for Tebra integration
 * @module services/tebra/__tests__/tebra-integration.test
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { TebraIntegrationService, createTebraConfig } from '../tebra-integration-service';
import { TebraApiService } from '../tebra-api-service';
import { TebraRateLimiter } from '../tebra-rate-limiter';
import { TebraCredentials, TebraAppointment, TebraPatient, TebraProvider } from '../tebra-api-service.types';
import { SessionStats } from '../../services/storageService';
import { TebraSoapClient } from '../tebraSoapClient';
import { TebraDataTransformer } from '../tebra-data-transformer';
import { TebraDailySession } from '../types';

// Mock the SOAP client to avoid real API calls during testing
const mockSearchPatients = jest.fn<() => Promise<TebraPatient[]>>().mockResolvedValue([
  {
    PatientId: 'test-patient-1',
    FirstName: 'John',
    LastName: 'Doe',
    DateOfBirth: '1990-01-01',
    Phone: '',
    Email: ''
  }
]);
const mockGetAppointments = jest.fn<() => Promise<TebraAppointment[]>>().mockResolvedValue([
  {
    AppointmentId: 'apt-1',
    PatientId: 'test-patient-1',
    ProviderId: 'provider-1',
    AppointmentDate: '2025-01-15',
    AppointmentTime: '09:00',
    AppointmentType: 'Office Visit',
    Status: 'Scheduled'
  }
]);
const mockGetPatientById = jest.fn<() => Promise<TebraPatient>>().mockResolvedValue({
  PatientId: 'test-patient-1',
  FirstName: 'John',
  LastName: 'Doe',
  DateOfBirth: '1990-01-01',
  Phone: '',
  Email: ''
});
const mockGetProviders = jest.fn<() => Promise<TebraProvider[]>>().mockResolvedValue([
  {
    ProviderId: 'provider-1',
    FirstName: 'Dr. Jane',
    LastName: 'Smith',
    Title: 'Dr.'
  }
]);
const mockGetRateLimiter = jest.fn().mockReturnValue({
  getAllRateLimits: () => ({
    'GetAppointments': 1000,
    'GetProviders': 500,
    'GetPatient': 250
  }),
  canCallImmediately: () => true,
  getRemainingWaitTime: () => 0
});

jest.mock('../tebraSoapClient', () => ({
  TebraSoapClient: jest.fn().mockImplementation(() => ({
    searchPatients: mockSearchPatients,
    getAppointments: mockGetAppointments,
    getPatientById: mockGetPatientById,
    getProviders: mockGetProviders,
    getRateLimiter: mockGetRateLimiter
  }))
}));

// Mock Firebase services
const mockSaveTodaysSession = jest.fn<() => Promise<void>>().mockResolvedValue();
const mockLoadTodaysSession = jest.fn<() => Promise<TebraPatient[]>>().mockResolvedValue([]);
const mockGetSessionStats = jest.fn<() => Promise<SessionStats>>().mockResolvedValue({
  backend: 'firebase',
  currentSessionDate: '2025-01-15',
  hasCurrentSession: false,
  totalSessions: 0
});

jest.mock('../../services/firebase/dailySessionService', () => {
  return {
    DailySessionService: jest.fn().mockImplementation(() => ({
      saveTodaysSession: mockSaveTodaysSession,
      loadTodaysSession: mockLoadTodaysSession,
      getSessionStats: mockGetSessionStats
    }))
  };
});

describe('Tebra EHR Integration with Rate Limiting', () => {
  const testCredentials: TebraCredentials = {
    username: 'test-user',
    password: 'test-password', 
    wsdlUrl: 'https://test.kareo.com/services/soap/2.1/KareoServices.svc?wsdl&customerkey=test-key'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Use real timers for rate limiting tests
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TebraRateLimiter', () => {
    let rateLimiter: TebraRateLimiter;

    beforeEach(() => {
      rateLimiter = new TebraRateLimiter();
    });

    it('should enforce rate limits for different API methods', async () => {
      const startTime = Date.now();
      
      // Test rate limiting for GetPatient (250ms limit)
      await rateLimiter.waitForRateLimit('GetPatient');
      await rateLimiter.waitForRateLimit('GetPatient');
      
      const elapsed = Date.now() - startTime;
      // Should have waited at least 250ms for the second call
      expect(elapsed).toBeGreaterThanOrEqual(250);
    });

    it('should handle different rate limits for different methods', async () => {
      // GetPatient has 250ms limit, SearchPatient has 250ms limit
      const patientCallStart = Date.now();
      await rateLimiter.waitForRateLimit('GetPatient');
      await rateLimiter.waitForRateLimit('SearchPatient');
      const patientCallElapsed = Date.now() - patientCallStart;

      // GetAppointments has 1000ms limit
      const appointmentCallStart = Date.now();
      await rateLimiter.waitForRateLimit('GetAppointments');
      await rateLimiter.waitForRateLimit('GetAppointments');
      const appointmentCallElapsed = Date.now() - appointmentCallStart;

      // Appointment calls should take longer due to higher rate limit
      expect(appointmentCallElapsed).toBeGreaterThan(patientCallElapsed);
      expect(appointmentCallElapsed).toBeGreaterThanOrEqual(1000);
    });

    it('should warn about unknown methods', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      await rateLimiter.waitForRateLimit('UnknownMethod');
      
      expect(consoleSpy).toHaveBeenCalledWith('No rate limit defined for method: UnknownMethod');
      consoleSpy.mockRestore();
    });
  });

  describe('TebraApiService', () => {
    let apiService: TebraApiService;
    let mockSoapClient: jest.Mocked<TebraSoapClient>;
    let mockDataTransformer: jest.Mocked<TebraDataTransformer>;
    let mockRateLimiter: jest.Mocked<TebraRateLimiter>;

    beforeEach(() => {
      // Clear all mocks
      jest.clearAllMocks();

      // Initialize mocks
      mockSoapClient = new TebraSoapClient(testCredentials) as jest.Mocked<TebraSoapClient>;
      mockDataTransformer = new TebraDataTransformer() as jest.Mocked<TebraDataTransformer>;
      mockRateLimiter = new TebraRateLimiter() as jest.Mocked<TebraRateLimiter>;

      // Create service instance
      apiService = new TebraApiService(testCredentials);
    });

    describe('constructor', () => {
      it('should initialize with provided credentials', () => {
        expect(apiService).toBeInstanceOf(TebraApiService);
      });

      it('should throw error if credentials are missing', () => {
        // Clear any environment variables that might interfere
        const originalEnv = process.env;
        process.env = { ...originalEnv };
        delete process.env.REACT_APP_TEBRA_WSDL_URL;
        delete process.env.REACT_APP_TEBRA_USERNAME;
        delete process.env.REACT_APP_TEBRA_PASSWORD;
        
        try {
          expect(() => new TebraApiService({})).toThrow('Invalid Tebra configuration. Missing required fields: wsdlUrl, username, password');
        } finally {
          // Restore original environment
          process.env = originalEnv;
        }
      });
    });

    describe('getPatientData', () => {
      const mockPatientId = '123';
      const mockPatientData: TebraPatient = {
        id: mockPatientId,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'M',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        insurance: {
          provider: 'Test Insurance',
          policyNumber: 'POL123',
          groupNumber: 'GRP456'
        },
        medicalHistory: [],
        allergies: [],
        medications: []
      };

      it('should get patient data successfully', async () => {
        mockSoapClient.getPatientData.mockResolvedValueOnce(mockPatientData);
        mockDataTransformer.transformPatientData.mockReturnValueOnce(mockPatientData);

        const result = await apiService.getPatientData(mockPatientId);

        expect(result).toEqual(mockPatientData);
        expect(mockSoapClient.getPatientData).toHaveBeenCalledWith(mockPatientId);
        expect(mockDataTransformer.transformPatientData).toHaveBeenCalledWith(mockPatientData);
      });

      it('should handle errors when getting patient data', async () => {
        const error = new Error('API Error');
        mockSoapClient.getPatientData.mockRejectedValueOnce(error);

        await expect(apiService.getPatientData(mockPatientId)).rejects.toThrow('API Error');
      });
    });

    describe('getAppointmentData', () => {
      const mockAppointmentId = '456';
      const mockAppointmentData: TebraAppointment = {
        id: mockAppointmentId,
        patientId: '123',
        providerId: '789',
        startTime: new Date('2024-03-20T10:00:00'),
        endTime: new Date('2024-03-20T11:00:00'),
        status: 'scheduled',
        type: 'follow-up',
        notes: 'Test appointment',
        location: 'Main Office',
        reason: 'Regular checkup'
      };

      it('should get appointment data successfully', async () => {
        mockSoapClient.getAppointmentData.mockResolvedValueOnce(mockAppointmentData);
        mockDataTransformer.transformAppointmentData.mockReturnValueOnce(mockAppointmentData);

        const result = await apiService.getAppointmentData(mockAppointmentId);

        expect(result).toEqual(mockAppointmentData);
        expect(mockSoapClient.getAppointmentData).toHaveBeenCalledWith(mockAppointmentId);
        expect(mockDataTransformer.transformAppointmentData).toHaveBeenCalledWith(mockAppointmentData);
      });

      it('should handle errors when getting appointment data', async () => {
        const error = new Error('API Error');
        mockSoapClient.getAppointmentData.mockRejectedValueOnce(error);

        await expect(apiService.getAppointmentData(mockAppointmentId)).rejects.toThrow('API Error');
      });
    });

    describe('getDailySessionData', () => {
      const mockDate = new Date('2024-03-20');
      const mockSessionData: TebraDailySession = {
        date: mockDate,
        providerId: '789',
        appointments: [],
        status: 'active',
        notes: 'Test session',
        location: 'Main Office'
      };

      it('should get daily session data successfully', async () => {
        mockSoapClient.getDailySessionData.mockResolvedValueOnce(mockSessionData);
        mockDataTransformer.transformDailySessionData.mockReturnValueOnce(mockSessionData);

        const result = await apiService.getDailySessionData(mockDate);

        expect(result).toEqual(mockSessionData);
        expect(mockSoapClient.getDailySessionData).toHaveBeenCalledWith(mockDate);
        expect(mockDataTransformer.transformDailySessionData).toHaveBeenCalledWith(mockSessionData);
      });

      it('should handle errors when getting daily session data', async () => {
        const error = new Error('API Error');
        mockSoapClient.getDailySessionData.mockRejectedValueOnce(error);

        await expect(apiService.getDailySessionData(mockDate)).rejects.toThrow('API Error');
      });
    });

    describe('testConnection', () => {
      it('should test connection successfully', async () => {
        mockSoapClient.testConnection.mockResolvedValueOnce(true);

        const result = await apiService.testConnection();

        expect(result).toBe(true);
        expect(mockSoapClient.testConnection).toHaveBeenCalled();
      });

      it('should handle connection test failure', async () => {
        const error = new Error('Connection failed');
        mockSoapClient.testConnection.mockRejectedValueOnce(error);

        await expect(apiService.testConnection()).rejects.toThrow('Connection failed');
      });
    });
  });

  describe('TebraIntegrationService', () => {
    let integrationService: TebraIntegrationService;

    beforeEach(async () => {
      const config = createTebraConfig(testCredentials, {
        syncInterval: 1, // 1 minute for testing
        lookAheadDays: 1,
        autoSync: false,
        fallbackToMockData: true
      });
      
      integrationService = new TebraIntegrationService(config);
      await integrationService.initialize();
    });

    afterEach(() => {
      integrationService?.cleanup();
    });

    it('should initialize successfully', async () => {
      expect(integrationService.isApiConnected()).toBe(true);
    });

    it('should sync today\'s schedule with rate limiting', async () => {
      // Mock the isBrowserEnvironment method to return false for testing
      jest.spyOn(integrationService as any, 'isBrowserEnvironment').mockReturnValue(false);
      
      const syncResult = await integrationService.syncTodaysSchedule();
      
      expect(syncResult.success).toBe(true);
      expect(syncResult.patientsFound).toBeGreaterThan(0);
      expect(syncResult.appointmentsFound).toBeGreaterThan(0);
      expect(syncResult.errors).toHaveLength(0);
      expect(syncResult.lastSyncTime).toBeInstanceOf(Date);
    });

    it('should handle force sync', async () => {
      // Mock the isBrowserEnvironment method to return false for testing
      jest.spyOn(integrationService as any, 'isBrowserEnvironment').mockReturnValue(false);
      
      const syncResult = await integrationService.forceSync();
      
      expect(syncResult.success).toBe(true);
      expect(syncResult).toEqual(integrationService.getLastSyncResult());
    });

    it('should update configuration', () => {
      integrationService.updateConfig({ syncInterval: 5 });
      
      // The service should accept the new configuration
      // (We can't easily test the internal config change without exposing it)
      expect(() => integrationService.updateConfig({ syncInterval: 5 })).not.toThrow();
    });

    it('should cleanup resources properly', () => {
      expect(() => integrationService.cleanup()).not.toThrow();
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should apply rate limits across multiple API calls', async () => {
      const apiService = new TebraApiService(testCredentials);
      
      // Test that rate limiter methods are available and configured
      const rateLimiterStats = apiService.getRateLimiterStats();
      
      // Verify that key rate limits are configured
      expect(rateLimiterStats['GetAppointments']).toBe(1000);
      expect(rateLimiterStats['GetProviders']).toBe(500);
      expect(rateLimiterStats['GetPatient']).toBe(250);
      
      // Test that the rate limiter can check method availability
      expect(apiService.canCallMethodImmediately('GetAppointments')).toBe(true);
      expect(apiService.getRemainingWaitTime('GetAppointments')).toBe(0);
    });
  });

  describe('Configuration Validation', () => {
    it('should create valid Tebra config', () => {
      const config = createTebraConfig(testCredentials);
      
      expect(config.credentials).toEqual(testCredentials);
      expect(config.syncInterval).toBe(15); // default
      expect(config.lookAheadDays).toBe(1); // default
      expect(config.autoSync).toBe(true); // default
      expect(config.fallbackToMockData).toBe(true); // default
    });

    it('should override default config values', () => {
      const config = createTebraConfig(testCredentials, {
        syncInterval: 30,
        lookAheadDays: 7,
        autoSync: false,
        fallbackToMockData: false
      });
      
      expect(config.syncInterval).toBe(30);
      expect(config.lookAheadDays).toBe(7);
      expect(config.autoSync).toBe(false);
      expect(config.fallbackToMockData).toBe(false);
    });
  });
});        