const { syncSchedule } = require('../syncSchedule');
const { tebraProxyClient } = require('../tebra-proxy-client');
const { firestoreDailySessionRepo } = require('../../services/firestoreDailySession');

// Mock external dependencies
jest.mock('../tebra-proxy-client');
jest.mock('../../services/firestoreDailySession');

describe('Schedule Import Integration Tests', () => {
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
  });

  describe('End-to-End Schedule Sync', () => {
    it('should complete full sync workflow successfully', async () => {
      // Mock Tebra API responses
      const mockAppointments = [
        {
          PatientID: 'p1',
          PatientFullName: 'John Doe',
          StartDate: '2024-01-15T09:00:00',
          AppointmentReason1: 'Annual Physical',
          ResourceID1: 'provider1',
          ConfirmationStatus: 'Confirmed'
        },
        {
          PatientID: 'p2',
          PatientFullName: 'Jane Smith',
          StartDate: '2024-01-15T10:30:00',
          AppointmentReason1: 'Follow-up',
          ResourceID1: 'provider2',
          ConfirmationStatus: 'Scheduled'
        }
      ];

      const mockProviders = [
        {
          ProviderId: 'provider1',
          FirstName: 'Sarah',
          LastName: 'Johnson',
          Title: 'MD'
        },
        {
          ProviderId: 'provider2',
          FirstName: 'Michael',
          LastName: 'Brown',
          Title: 'DO'
        }
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue(mockProviders);
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      const result = await syncSchedule(dependencies, '2024-01-15', 'user123');

      // Verify successful sync
      expect(result).toBe(2);
      
      // Verify API calls
      expect(tebraProxyClient.getAppointments).toHaveBeenCalledWith('2024-01-15', '2024-01-15');
      expect(tebraProxyClient.getProviders).toHaveBeenCalled();
      
      // Verify data transformation and storage
      expect(firestoreDailySessionRepo.save).toHaveBeenCalledWith(
        '2024-01-15',
        [
          {
            id: 'p1',
            name: 'John Doe',
            dob: '',
            appointmentTime: '2024-01-15T09:00:00',
            appointmentType: 'Annual Physical',
            provider: 'MD Sarah Johnson',
            status: 'Confirmed',
            phone: '',
            email: ''
          },
          {
            id: 'p2',
            name: 'Jane Smith',
            dob: '',
            appointmentTime: '2024-01-15T10:30:00',
            appointmentType: 'Follow-up',
            provider: 'DO Michael Brown',
            status: 'Scheduled',
            phone: '',
            email: ''
          }
        ],
        'user123'
      );

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔍 Syncing appointments for date range:',
        { fromDate: '2024-01-15', toDate: '2024-01-15' }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '✅ Saved 2 patients for 2024-01-15 to 2024-01-15'
      );
    });

    it('should handle partial failures gracefully', async () => {
      // Mock scenario where some appointments fail processing
      const mockAppointments = [
        {
          PatientID: 'p1',
          PatientFullName: 'John Doe',
          StartDate: '2024-01-15T09:00:00',
          ConfirmationStatus: 'Confirmed'
        },
        {
          // Missing PatientID - should be skipped
          PatientFullName: 'Jane Smith',
          StartDate: '2024-01-15T10:30:00'
        },
        {
          PatientID: 'p3',
          PatientFullName: 'Bob Wilson',
          StartDate: '2024-01-15T11:00:00',
          ConfirmationStatus: 'Scheduled'
        }
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue([]);
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      const result = await syncSchedule(dependencies, '2024-01-15');

      // Should process 2 out of 3 appointments (skipping the one without PatientID)
      expect(result).toBe(2);
      
      // Verify warning was logged for skipped appointment
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '⚠️ Skipping appointment with missing PatientId',
        expect.objectContaining({
          PatientFullName: 'Jane Smith'
        })
      );
    });

    it('should handle date range synchronization', async () => {
      const mockAppointments = [
        { PatientID: 'p1', PatientFullName: 'Patient 1', StartDate: '2024-01-15T09:00:00' },
        { PatientID: 'p2', PatientFullName: 'Patient 2', StartDate: '2024-01-16T10:00:00' },
        { PatientID: 'p3', PatientFullName: 'Patient 3', StartDate: '2024-01-17T11:00:00' }
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue([]);
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      const dateRange = { fromDate: '2024-01-15', toDate: '2024-01-17' };
      const result = await syncSchedule(dependencies, dateRange);

      expect(result).toBe(3);
      expect(tebraProxyClient.getAppointments).toHaveBeenCalledWith('2024-01-15', '2024-01-17');
      
      // Note: The current implementation saves with fromDate as the key
      // This might need adjustment for proper date range handling
      expect(firestoreDailySessionRepo.save).toHaveBeenCalledWith(
        '2024-01-15', // This is the fromDate
        expect.arrayContaining([
          expect.objectContaining({ id: 'p1', name: 'Patient 1' }),
          expect.objectContaining({ id: 'p2', name: 'Patient 2' }),
          expect.objectContaining({ id: 'p3', name: 'Patient 3' })
        ]),
        'system'
      );
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should continue operation when provider loading fails', async () => {
      const mockAppointments = [
        {
          PatientID: 'p1',
          PatientFullName: 'John Doe',
          ResourceID1: 'unknown-provider'
        }
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockRejectedValue(new Error('Provider service unavailable'));
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      const result = await syncSchedule(dependencies, '2024-01-15');

      expect(result).toBe(1);
      
      // Should show "Unknown Provider" when provider mapping fails
      expect(firestoreDailySessionRepo.save).toHaveBeenCalledWith(
        '2024-01-15',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'p1',
            name: 'John Doe',
            provider: 'Unknown Provider'
          })
        ]),
        'system'
      );
      
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '⚠️ Failed to load providers, continuing without provider mapping:',
        expect.objectContaining({
          message: 'Provider service unavailable'
        })
      );
    });

    it('should handle complete API failure', async () => {
      tebraProxyClient.getAppointments.mockRejectedValue(new Error('Tebra API unavailable'));

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      const result = await syncSchedule(dependencies, '2024-01-15');

      expect(result).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to get appointments:',
        expect.objectContaining({
          message: 'Tebra API unavailable'
        })
      );
      
      // Should not attempt to save when no data retrieved
      expect(firestoreDailySessionRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate repository save errors', async () => {
      const mockAppointments = [
        { PatientID: 'p1', PatientFullName: 'John Doe' }
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue([]);
      firestoreDailySessionRepo.save.mockRejectedValue(new Error('Database connection failed'));

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      await expect(syncSchedule(dependencies, '2024-01-15')).rejects.toThrow(
        'Database connection failed'
      );
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to save patients to repository:',
        expect.objectContaining({
          message: 'Database connection failed',
          patientsCount: 1,
          dateRange: { fromDate: '2024-01-15', toDate: '2024-01-15' }
        })
      );
    });
  });

  describe('Data Transformation and Mapping', () => {
    it('should handle various appointment status formats', async () => {
      const mockAppointments = [
        { PatientID: 'p1', PatientFullName: 'Patient 1', ConfirmationStatus: 'CONFIRMED' },
        { PatientID: 'p2', PatientFullName: 'Patient 2', ConfirmationStatus: 'cancelled' },
        { PatientID: 'p3', PatientFullName: 'Patient 3', ConfirmationStatus: 'No Show' },
        { PatientID: 'p4', PatientFullName: 'Patient 4', ConfirmationStatus: 'unknown_status' },
        { PatientID: 'p5', PatientFullName: 'Patient 5' } // No status
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue([]);
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      await syncSchedule(dependencies, '2024-01-15');

      const savedPatients = firestoreDailySessionRepo.save.mock.calls[0][1];
      
      expect(savedPatients[0].status).toBe('Confirmed');   // CONFIRMED -> Confirmed
      expect(savedPatients[1].status).toBe('Cancelled');   // cancelled -> Cancelled
      expect(savedPatients[2].status).toBe('No Show');     // No Show -> No Show
      expect(savedPatients[3].status).toBe('Scheduled');   // unknown -> Scheduled (default)
      expect(savedPatients[4].status).toBe('Scheduled');   // missing -> Scheduled (default)
    });

    it('should handle provider mapping with different ID formats', async () => {
      const mockAppointments = [
        { PatientID: 'p1', PatientFullName: 'Patient 1', ResourceID1: 'provider1' },
        { PatientID: 'p2', PatientFullName: 'Patient 2', ProviderId: 'provider2' },
        { PatientID: 'p3', PatientFullName: 'Patient 3', providerId: 'provider3' }
      ];

      const mockProviders = [
        { ProviderId: 'provider1', FirstName: 'John', LastName: 'Smith', Title: 'MD' },
        { ID: 'provider2', FirstName: 'Jane', LastName: 'Doe', Degree: 'DO' },
        { Id: 'provider3', FirstName: 'Bob', LastName: 'Wilson' }
      ];

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue(mockProviders);
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      await syncSchedule(dependencies, '2024-01-15');

      const savedPatients = firestoreDailySessionRepo.save.mock.calls[0][1];
      
      expect(savedPatients[0].provider).toBe('MD John Smith');
      expect(savedPatients[1].provider).toBe('DO Jane Doe');
      expect(savedPatients[2].provider).toBe('Dr. Bob Wilson'); // Default title when none provided
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large appointment datasets efficiently', async () => {
      // Create 100 appointments to test performance
      const mockAppointments = Array.from({ length: 100 }, (_, i) => ({
        PatientID: `patient-${i}`,
        PatientFullName: `Patient ${i}`,
        StartDate: `2024-01-15T${String(9 + (i % 8)).padStart(2, '0')}:00:00`,
        ConfirmationStatus: 'Scheduled'
      }));

      tebraProxyClient.getAppointments.mockResolvedValue(mockAppointments);
      tebraProxyClient.getProviders.mockResolvedValue([]);
      firestoreDailySessionRepo.save.mockResolvedValue();

      const dependencies = {
        tebra: tebraProxyClient,
        repo: firestoreDailySessionRepo,
        logger: mockLogger,
        now: () => new Date('2024-01-15T12:00:00Z'),
        timezone: 'America/New_York'
      };

      const startTime = Date.now();
      const result = await syncSchedule(dependencies, '2024-01-15');
      const endTime = Date.now();

      expect(result).toBe(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second for mocked operations
      
      // Verify concurrency control was mentioned in logs
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🚀 Processing appointments with bounded concurrency (max 10)'
      );
    });
  });
});