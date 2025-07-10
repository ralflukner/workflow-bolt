/**
 * @fileoverview Integration tests for TebraIntegrationService schedule sync
 * @module src/tebra-soap/__tests__/tebra-integration.test
 */

// Mock problematic imports first
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
  functions: {}
}));

jest.mock('../../services/firebase/dailySessionService');

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TebraIntegrationService, createTebraConfig } from '../tebra-integration-service';
import { TebraApiService } from '../tebra-api-service';
import { TebraCredentials, TebraAppointment, TebraPatient, TebraProvider } from '../tebra-api-service.types';

// Mock the TebraApiService
jest.mock('../tebra-api-service');

describe('TebraIntegrationService - Schedule Sync Tests', () => {
  const testCredentials: TebraCredentials = {
    username: 'test-user',
    password: 'test-password',
    customerKey: 'test-customer-key',
    wsdlUrl: 'https://test.example.com/wsdl'
  };

  let integrationService: TebraIntegrationService;
  let mockApiService: jest.Mocked<TebraApiService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock API service
    mockApiService = {
      getAppointments: jest.fn(),
      getPatients: jest.fn(),
      getProviders: jest.fn(),
      testConnection: jest.fn(),
      getPatientData: jest.fn(),
      getAppointmentData: jest.fn(),
      getDailySessionData: jest.fn(),
      getRateLimiterStats: jest.fn(),
      canCallMethodImmediately: jest.fn(),
      getRemainingWaitTime: jest.fn(),
    } as any;

    // Mock the TebraApiService constructor
    (TebraApiService as jest.MockedClass<typeof TebraApiService>).mockImplementation(() => mockApiService);

    const config = createTebraConfig(testCredentials, {
      syncInterval: 5,
      lookAheadDays: 3,
      autoSync: false,
      fallbackToMockData: false
    });

    integrationService = new TebraIntegrationService(config);
  });

  describe('syncTodaysSchedule()', () => {
    it('should successfully sync appointments from Tebra SOAP', async () => {
      // Mock successful API responses
      const mockAppointments: TebraAppointment[] = [
        {
          AppointmentId: 'appt-1',
          PatientId: 'patient-1',
          ProviderId: 'provider-1',
          StartTime: '2025-07-08T10:00:00',
          EndTime: '2025-07-08T10:30:00',
          Status: 'Confirmed',
          Type: 'Office Visit',
          Notes: 'Regular checkup',
          CreatedAt: '2025-07-08T09:00:00',
          UpdatedAt: '2025-07-08T09:00:00'
        },
        {
          AppointmentId: 'appt-2',
          PatientId: 'patient-2',
          ProviderId: 'provider-2',
          StartTime: '2025-07-08T14:00:00',
          EndTime: '2025-07-08T14:45:00',
          Status: 'Scheduled',
          Type: 'Consultation',
          Notes: 'Follow-up appointment',
          CreatedAt: '2025-07-08T13:00:00',
          UpdatedAt: '2025-07-08T13:00:00'
        }
      ];

      const mockPatients: TebraPatient[] = [
        {
          PatientId: 'patient-1',
          FirstName: 'John',
          LastName: 'Doe',
          DateOfBirth: '1980-01-01',
          Gender: 'M',
          Phone: '555-0001',
          Address: {
            Street: '123 Main St',
            City: 'Test City',
            State: 'TS',
            ZipCode: '12345',
            Country: 'USA'
          },
          Insurance: {
            Provider: 'Test Insurance',
            PolicyNumber: 'POL123',
            GroupNumber: 'GRP456'
          },
          Email: 'john.doe@example.com',
          CreatedAt: '2025-01-01T00:00:00',
          UpdatedAt: '2025-01-01T00:00:00'
        },
        {
          PatientId: 'patient-2',
          FirstName: 'Jane',
          LastName: 'Smith',
          DateOfBirth: '1975-05-15',
          Gender: 'F',
          Phone: '555-0003',
          Address: {
            Street: '456 Oak Ave',
            City: 'Test City',
            State: 'TS',
            ZipCode: '12345',
            Country: 'USA'
          },
          Insurance: {
            Provider: 'Test Insurance',
            PolicyNumber: 'POL124',
            GroupNumber: 'GRP456'
          },
          Email: 'jane.smith@example.com',
          CreatedAt: '2025-01-01T00:00:00',
          UpdatedAt: '2025-01-01T00:00:00'
        }
      ];

      const mockProviders: TebraProvider[] = [
        {
          ProviderId: 'provider-1',
          FirstName: 'Dr.',
          LastName: 'Johnson',
          Title: 'Dr.'
        },
        {
          ProviderId: 'provider-2',
          FirstName: 'Dr.',
          LastName: 'Williams',
          Title: 'Dr.'
        }
      ];

      // Setup mock responses
      mockApiService.getAppointments.mockResolvedValue(mockAppointments);
      mockApiService.getPatients.mockResolvedValue(mockPatients);
      mockApiService.getProviders.mockResolvedValue(mockProviders);
      mockApiService.testConnection.mockResolvedValue(true);

      // Mock the daily session service
      const mockDailySessionService = {
        saveTodaysSession: jest.fn().mockResolvedValue(undefined)
      };
      (integrationService as any).dailySessionService = mockDailySessionService;

      // Initialize the service
      await integrationService.initialize();

      // Call syncTodaysSchedule
      const result = await (integrationService as any).syncTodaysSchedule();

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.patientsFound).toBe(2);
      expect(result.appointmentsFound).toBe(2);
      expect(result.errors).toEqual([]);
      expect(result.lastSyncTime).toBeInstanceOf(Date);

      // Verify API calls were made
      expect(mockApiService.getAppointments).toHaveBeenCalledWith(
        expect.any(Date), // fromDate
        expect.any(Date)  // toDate
      );
      expect(mockApiService.getPatients).toHaveBeenCalledWith(['patient-1', 'patient-2']);
      expect(mockApiService.getProviders).toHaveBeenCalled();

      // Verify data was saved
      expect(mockDailySessionService.saveTodaysSession).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            PatientId: 'patient-1',
            FirstName: 'John',
            LastName: 'Doe'
          }),
          expect.objectContaining({
            PatientId: 'patient-2',
            FirstName: 'Jane',
            LastName: 'Smith'
          })
        ])
      );
    });

    it('should handle empty appointments gracefully', async () => {
      // Mock empty appointments
      mockApiService.getAppointments.mockResolvedValue([]);
      mockApiService.testConnection.mockResolvedValue(true);

      // Initialize the service
      await integrationService.initialize();

      // Call syncTodaysSchedule
      const result = await (integrationService as any).syncTodaysSchedule();

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.patientsFound).toBe(0);
      expect(result.appointmentsFound).toBe(0);
      expect(result.errors).toEqual([]);

      // Verify API call was made
      expect(mockApiService.getAppointments).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockApiService.getAppointments.mockRejectedValue(new Error('API connection failed'));
      mockApiService.testConnection.mockResolvedValue(true);

      // Initialize the service
      await integrationService.initialize();

      // Call syncTodaysSchedule
      const result = await (integrationService as any).syncTodaysSchedule();

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.patientsFound).toBe(0);
      expect(result.appointmentsFound).toBe(0);
      expect(result.errors).toContain('API connection failed');
    });

    it('should handle missing patient data', async () => {
      const mockAppointments: TebraAppointment[] = [
        {
          AppointmentId: 'appt-1',
          PatientId: 'patient-1',
          ProviderId: 'provider-1',
          StartTime: '2025-07-08T10:00:00',
          EndTime: '2025-07-08T10:30:00',
          Status: 'Confirmed',
          Type: 'Office Visit',
          Notes: 'Test appointment',
          CreatedAt: '2025-07-08T09:00:00',
          UpdatedAt: '2025-07-08T09:00:00'
        }
      ];

      const mockPatients = []; // No patients found
      const mockProviders = [];

      mockApiService.getAppointments.mockResolvedValue(mockAppointments);
      mockApiService.getPatients.mockResolvedValue(mockPatients);
      mockApiService.getProviders.mockResolvedValue(mockProviders);
      mockApiService.testConnection.mockResolvedValue(true);

      // Initialize the service
      await integrationService.initialize();

      // Call syncTodaysSchedule
      const result = await (integrationService as any).syncTodaysSchedule();

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.patientsFound).toBe(0);
      expect(result.appointmentsFound).toBe(1);
      expect(result.errors).toContain('Patient not found for appointment appt-1');
    });

    it('should handle browser environment gracefully', async () => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true
      });

      // Initialize the service
      await integrationService.initialize();

      // Call syncTodaysSchedule
      const result = await (integrationService as any).syncTodaysSchedule();

      // Verify the result
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Tebra SOAP integration not available in browser environment');

      // Cleanup
      delete (global as any).window;
    });
  });

  describe('forceSync()', () => {
    it('should call syncTodaysSchedule when forceSync is called', async () => {
      mockApiService.getAppointments.mockResolvedValue([]);
      mockApiService.testConnection.mockResolvedValue(true);

      // Initialize the service
      await integrationService.initialize();

      // Call forceSync
      const result = await integrationService.forceSync();

      // Verify it calls syncTodaysSchedule
      expect(result.success).toBe(true);
      expect(mockApiService.getAppointments).toHaveBeenCalled();
    });
  });

  describe('getLastSyncResult()', () => {
    it('should return the last sync result', async () => {
      mockApiService.getAppointments.mockResolvedValue([]);
      mockApiService.testConnection.mockResolvedValue(true);

      // Initialize the service
      await integrationService.initialize();

      // Initially should be null
      expect(integrationService.getLastSyncResult()).toBeNull();

      // Perform a sync
      await integrationService.forceSync();

      // Should now have a result
      const lastResult = integrationService.getLastSyncResult();
      expect(lastResult).not.toBeNull();
      expect(lastResult?.success).toBe(true);
    });
  });
}); 