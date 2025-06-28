const { syncSchedule } = require('../syncSchedule');

describe('syncSchedule', () => {
  let mockTebra, mockRepo, mockLogger, mockNow;
  const mockTimezone = 'America/New_York';

  beforeEach(() => {
    mockTebra = {
      getAppointments: jest.fn(),
      getProviders: jest.fn(),
    };
    
    mockRepo = {
      save: jest.fn(),
    };
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    
    mockNow = jest.fn(() => new Date('2024-01-15T10:00:00Z'));
  });

  describe('Input Validation', () => {
    it('should throw error when missing required dependencies', async () => {
      await expect(syncSchedule({}, '2024-01-15')).rejects.toThrow(
        'Missing required dependencies: tebra, repo, logger, now, timezone'
      );
    });

    it('should validate date format for string dateOverride', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      await expect(syncSchedule(deps, 'invalid-date')).rejects.toThrow(
        'Date format must be YYYY-MM-DD'
      );
    });

    it('should validate date format for object dateOverride', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      await expect(syncSchedule(deps, { fromDate: '2024-1-15', toDate: '2024-01-16' })).rejects.toThrow(
        'Date format must be YYYY-MM-DD'
      );
    });

    it('should validate date order', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      await expect(syncSchedule(deps, { fromDate: '2024-01-16', toDate: '2024-01-15' })).rejects.toThrow(
        'fromDate must be before or equal to toDate'
      );
    });

    it('should validate dateOverride type', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      await expect(syncSchedule(deps, 123)).rejects.toThrow(
        'dateOverride must be a string (YYYY-MM-DD) or object with fromDate and toDate'
      );
    });
  });

  describe('Default Date Handling', () => {
    it('should use today when no dateOverride provided', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockResolvedValue([]);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue();

      await syncSchedule(deps);

      expect(mockTebra.getAppointments).toHaveBeenCalledWith('2024-01-15', '2024-01-15');
    });
  });

  describe('API Error Handling', () => {
    it('should handle getAppointments failure gracefully', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockRejectedValue(new Error('API Error'));
      
      const result = await syncSchedule(deps, '2024-01-15');
      
      expect(result).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Failed to get appointments:', {
        message: 'API Error',
        name: 'Error',
        code: undefined
      });
    });

    it('should continue without providers when getProviders fails', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      const mockAppointments = [{
        PatientID: '123',
        PatientFullName: 'John Doe',
        StartDate: '2024-01-15T09:00:00',
        AppointmentReason1: 'Checkup',
        ResourceID1: 'provider1',
        ConfirmationStatus: 'Confirmed'
      }];
      
      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getProviders.mockRejectedValue(new Error('Provider API Error'));
      mockRepo.save.mockResolvedValue();

      const result = await syncSchedule(deps, '2024-01-15');

      expect(result).toBe(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '⚠️ Failed to load providers, continuing without provider mapping:',
        { message: 'Provider API Error', name: 'Error' }
      );
    });

    it('should handle repository save failure', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockResolvedValue([{
        PatientID: '123',
        PatientFullName: 'John Doe'
      }]);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockRejectedValue(new Error('Database Error'));

      await expect(syncSchedule(deps, '2024-01-15')).rejects.toThrow('Database Error');
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to save patients to repository:',
        expect.objectContaining({
          message: 'Database Error',
          name: 'Error',
          patientsCount: 1,
          dateRange: { fromDate: '2024-01-15', toDate: '2024-01-15' }
        })
      );
    });
  });

  describe('Data Processing', () => {
    it('should handle empty appointments array', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockResolvedValue([]);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue();

      const result = await syncSchedule(deps, '2024-01-15');

      expect(result).toBe(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '⚠️ No appointments found for date range',
        { fromDate: '2024-01-15', toDate: '2024-01-15' }
      );
    });

    it('should handle non-array appointments response', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockResolvedValue('invalid response');

      const result = await syncSchedule(deps, '2024-01-15');

      expect(result).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('❌ Expected array but got:', 'string');
    });

    it('should skip appointments with missing PatientID', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      const mockAppointments = [
        { PatientFullName: 'John Doe' }, // Missing PatientID
        { PatientID: '123', PatientFullName: 'Jane Smith' }
      ];
      
      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue();

      const result = await syncSchedule(deps, '2024-01-15');

      expect(result).toBe(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        '⚠️ Skipping appointment with missing PatientId',
        { PatientFullName: 'John Doe' }
      );
    });

    it('should process appointments with provider mapping', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      const mockAppointments = [{
        PatientID: '123',
        PatientFullName: 'John Doe',
        StartDate: '2024-01-15T09:00:00',
        AppointmentReason1: 'Checkup',
        ResourceID1: 'provider1',
        ConfirmationStatus: 'Confirmed'
      }];
      
      const mockProviders = [{
        ProviderId: 'provider1',
        FirstName: 'Dr. Jane',
        LastName: 'Smith',
        Title: 'MD'
      }];
      
      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getProviders.mockResolvedValue(mockProviders);
      mockRepo.save.mockResolvedValue();

      const result = await syncSchedule(deps, '2024-01-15');

      expect(result).toBe(1);
      expect(mockRepo.save).toHaveBeenCalledWith(
        '2024-01-15',
        [{
          id: '123',
          name: 'John Doe',
          dob: '',
          appointmentTime: '2024-01-15T09:00:00',
          appointmentType: 'Checkup',
          provider: 'MD Dr. Jane Smith',
          status: 'Confirmed',
          phone: '',
          email: ''
        }],
        'system'
      );
    });

    it('should handle date ranges', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      const dateRange = { fromDate: '2024-01-15', toDate: '2024-01-17' };
      
      mockTebra.getAppointments.mockResolvedValue([]);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue();

      await syncSchedule(deps, dateRange);

      expect(mockTebra.getAppointments).toHaveBeenCalledWith('2024-01-15', '2024-01-17');
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🔍 Syncing appointments for date range:',
        { fromDate: '2024-01-15', toDate: '2024-01-17' }
      );
    });
  });

  describe('Status Mapping', () => {
    it('should map appointment statuses correctly', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      const mockAppointments = [
        { PatientID: '1', PatientFullName: 'Patient 1', ConfirmationStatus: 'confirmed' },
        { PatientID: '2', PatientFullName: 'Patient 2', ConfirmationStatus: 'cancelled' },
        { PatientID: '3', PatientFullName: 'Patient 3', ConfirmationStatus: 'no show' },
        { PatientID: '4', PatientFullName: 'Patient 4', ConfirmationStatus: 'unknown' },
        { PatientID: '5', PatientFullName: 'Patient 5' } // No status
      ];
      
      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue();

      await syncSchedule(deps, '2024-01-15');

      const savedPatients = mockRepo.save.mock.calls[0][1];
      expect(savedPatients[0].status).toBe('Confirmed');
      expect(savedPatients[1].status).toBe('Cancelled');
      expect(savedPatients[2].status).toBe('No Show');
      expect(savedPatients[3].status).toBe('Scheduled'); // Default for unknown
      expect(savedPatients[4].status).toBe('Scheduled'); // Default for missing
    });
  });

  describe('Concurrency Control', () => {
    it('should process appointments with bounded concurrency', async () => {
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      // Create 15 appointments to test concurrency limit
      const mockAppointments = Array.from({ length: 15 }, (_, i) => ({
        PatientID: `patient-${i}`,
        PatientFullName: `Patient ${i}`
      }));
      
      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getProviders.mockResolvedValue([]);
      mockRepo.save.mockResolvedValue();

      const result = await syncSchedule(deps, '2024-01-15');

      expect(result).toBe(15);
      expect(mockLogger.info).toHaveBeenCalledWith(
        '🚀 Processing appointments with bounded concurrency (max 10)'
      );
    });
  });

  describe('Environment-specific Behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log debug info in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockRejectedValue(new Error('Test Error'));

      await syncSchedule(deps, '2024-01-15');

      expect(mockLogger.debug).toHaveBeenCalledWith('Error stack:', expect.any(String));
    });

    it('should not log debug info in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const deps = { tebra: mockTebra, repo: mockRepo, logger: mockLogger, now: mockNow, timezone: mockTimezone };
      
      mockTebra.getAppointments.mockRejectedValue(new Error('Test Error'));

      await syncSchedule(deps, '2024-01-15');

      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });
});