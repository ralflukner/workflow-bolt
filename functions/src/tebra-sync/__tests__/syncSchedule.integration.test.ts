/**
 * ⚠️  SYNTHETIC TEST DATA ONLY - NO REAL PHI
 * All patient and provider data in this file is synthetic and for testing only.
 */
import { syncSchedule, SyncDeps } from '../syncSchedule';
import { TebraClient } from '../../types/tebra';
import { DailySessionRepo } from '../../services/firestoreDailySession';
import { Logger } from '../../services/logger';

describe('syncSchedule Integration Tests', () => {
  let mockTebra: jest.Mocked<TebraClient>;
  let mockRepo: jest.Mocked<DailySessionRepo>;
  let mockLogger: jest.Mocked<Logger>;
  let deps: SyncDeps;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockTebra = {
      getAppointments: jest.fn(),
      getPatientById: jest.fn(),
      getProviders: jest.fn(),
      searchPatients: jest.fn(),
      getPatientInsurances: jest.fn(),
      getPatientRecallExams: jest.fn(),
    };

    mockRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      getRecent: jest.fn(),
      purgeOld: jest.fn(),
    };

    deps = {
      tebra: mockTebra,
      repo: mockRepo,
      logger: mockLogger,
      now: () => new Date('2025-06-17T12:00:00.000Z'),
      timezone: 'America/Chicago',
    };
  });

  describe('Successful sync scenarios', () => {
    it('should sync today\'s appointments successfully', async () => {
      const mockAppointments = [
        {
          ID: 'appt-1',
          PatientId: 'patient-1',
          ProviderId: 'provider-1',
          AppointmentTypeId: 'type-1',
          AppointmentType: 'type-1',
          StartTime: '2025-06-17T10:00:00',
          EndTime: '2025-06-17T10:30:00',
          Status: 'Confirmed',
        },
        {
          ID: 'appt-2',
          PatientId: 'patient-2',
          ProviderId: 'provider-2',
          AppointmentTypeId: 'type-2',
          AppointmentType: 'type-2',
          StartTime: '2025-06-17T14:00:00',
          EndTime: '2025-06-17T14:45:00',
          Status: 'CheckedIn',
        },
      ];

      const mockPatients = {
        'patient-1': {
          ID: 'patient-1',
          PatientId: 'patient-1',
          PatientNumber: 'P001',
          FirstName: 'TestPatient',
          LastName: 'Alpha',
          DateOfBirth: '1980-01-01',
          Gender: 'M',
          HomePhone: '000-000-0001',
          MobilePhone: '000-000-0002',
          Email: 'test.patient.alpha@example.local',
        },
        'patient-2': {
          ID: 'patient-2',
          PatientId: 'patient-2',
          PatientNumber: 'P002',
          FirstName: 'TestPatient',
          LastName: 'Beta',
          DateOfBirth: '1975-01-01',
          Gender: 'F',
          HomePhone: '000-000-0003',
          MobilePhone: '000-000-0004',
          Email: 'test.patient.beta@example.local',
        },
      };

      const mockProviders = [
        {
          ID: 'provider-1',
          ProviderId: 'provider-1',
          FirstName: 'TestProvider',
          LastName: 'Alpha',
          Title: 'Dr.',
          Degree: 'MD',
        },
        {
          ID: 'provider-2',
          ProviderId: 'provider-2',
          FirstName: 'TestProvider',
          LastName: 'Beta',
          Title: 'Dr.',
          Degree: 'OD',
        },
      ];

      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getPatientById.mockImplementation((id) => 
        Promise.resolve(mockPatients[id])
      );
      mockTebra.getProviders.mockResolvedValue(mockProviders);

      const result = await syncSchedule(deps, undefined, 'test-user');

      expect(result).toBe(2);
      expect(mockTebra.getAppointments).toHaveBeenCalledWith('2025-06-17', '2025-06-17');
      expect(mockTebra.getPatientById).toHaveBeenCalledTimes(2);
      expect(mockRepo.save).toHaveBeenCalledWith(
        '2025-06-17',
        expect.arrayContaining([
          expect.objectContaining({
            id: 'patient-1',
            name: 'TestPatient Alpha',
            dob: '1980-01-01',
            provider: 'Dr. TestProvider Alpha',
            appointmentType: 'type-1',
            status: 'scheduled',
          }),
          expect.objectContaining({
            id: 'patient-2',
            name: 'TestPatient Beta',
            dob: '1975-01-01',
            provider: 'Dr. TestProvider Beta',
            appointmentType: 'type-2',
            status: 'arrived',
            checkInTime: expect.any(String),
          }),
        ]),
        'test-user'
      );
    });

    it('should handle date override parameter', async () => {
      mockTebra.getAppointments.mockResolvedValue([]);

      await syncSchedule(deps, '2025-06-15', 'test-user');

      expect(mockTebra.getAppointments).toHaveBeenCalledWith('2025-06-15', '2025-06-15');
    });

    it('should handle appointments with missing provider info', async () => {
      const mockAppointment = {
        ID: 'appt-1',
        PatientId: 'patient-1',
        ProviderId: 'unknown-provider',
        StartTime: '2025-06-17T10:00:00',
        Status: 'Confirmed',
      };

      const mockPatient = {
        ID: 'patient-1',
        FirstName: 'TestPatient',
        LastName: 'Alpha',
        DateOfBirth: '1980-01-01',
      };

      mockTebra.getAppointments.mockResolvedValue([mockAppointment]);
      mockTebra.getPatientById.mockResolvedValue(mockPatient);
      mockTebra.getProviders.mockResolvedValue([]);

      const result = await syncSchedule(deps);

      expect(result).toBe(1);
      expect(mockRepo.save).toHaveBeenCalledWith(
        '2025-06-17',
        expect.arrayContaining([
          expect.objectContaining({
            provider: 'Unknown Provider',
          }),
        ]),
        'system'
      );
    });

    it('should sync tomorrow\'s appointments successfully', async () => {
      const mockAppointments = [
        {
          ID: 'appt-10',
          PatientId: 'patient-10',
          ProviderId: 'provider-10',
          AppointmentTypeId: 'type-10',
          AppointmentType: 'type-10',
          StartTime: '2025-06-18T09:00:00',
          EndTime: '2025-06-18T09:30:00',
          Status: 'Confirmed',
        },
      ];

      const mockPatient = {
        ID: 'patient-10',
        PatientId: 'patient-10',
        PatientNumber: 'P010',
        FirstName: 'TestPatient',
        LastName: 'Gamma',
        DateOfBirth: '1990-01-01',
      };

      const mockProvider = {
        ID: 'provider-10',
        ProviderId: 'provider-10',
        FirstName: 'TestProvider',
        LastName: 'Gamma',
        Title: 'Dr.',
        Degree: 'MD',
      };

      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getPatientById.mockResolvedValue(mockPatient);
      mockTebra.getProviders.mockResolvedValue([mockProvider]);

      const tomorrow = '2025-06-18';
      const result = await syncSchedule(deps, tomorrow, 'test-user');

      expect(result).toBe(1);
      expect(mockTebra.getAppointments).toHaveBeenCalledWith(tomorrow, tomorrow);
      expect(mockRepo.save).toHaveBeenCalledWith(
        tomorrow,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'patient-10',
            name: 'TestPatient Gamma',
            provider: 'Dr. TestProvider Gamma',
            appointmentType: 'type-10',
            status: 'scheduled',
          }),
        ]),
        'test-user'
      );
    });

    it('should sync yesterday\'s appointments successfully', async () => {
      const yesterday = '2025-06-16';

      const mockAppointments = [
        {
          ID: 'appt-y1',
          PatientId: 'patient-y1',
          ProviderId: 'provider-y1',
          AppointmentType: 'type-y1',
          StartTime: `${yesterday}T09:15:00`,
          EndTime: `${yesterday}T09:45:00`,
          Status: 'CheckedIn',
        },
      ];

      const mockPatient = {
        ID: 'patient-y1',
        PatientId: 'patient-y1',
        FirstName: 'TestPatient',
        LastName: 'Delta',
      };

      const mockProvider = {
        ID: 'provider-y1',
        ProviderId: 'provider-y1',
        FirstName: 'TestProvider',
        LastName: 'Delta',
        Title: 'Dr.',
      };

      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getPatientById.mockResolvedValue(mockPatient);
      mockTebra.getProviders.mockResolvedValue([mockProvider]);

      const result = await syncSchedule(deps, yesterday, 'test-user');

      expect(result).toBe(1);
      expect(mockTebra.getAppointments).toHaveBeenCalledWith(yesterday, yesterday);
      expect(mockRepo.save).toHaveBeenCalledWith(
        yesterday,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'patient-y1',
            name: 'TestPatient Delta',
            provider: 'Dr. TestProvider Delta',
            status: 'arrived',
          }),
        ]),
        'test-user'
      );
    });
  });

  describe('Error handling scenarios', () => {
    it('should return 0 when no appointments found', async () => {
      mockTebra.getAppointments.mockResolvedValue([]);

      const result = await syncSchedule(deps);

      expect(result).toBe(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No appointments found',
        { date: '2025-06-17' }
      );
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('should continue processing when one patient fails', async () => {
      const mockAppointments = [
        {
          ID: 'appt-1',
          PatientId: 'patient-1',
          StartTime: '2025-06-17T10:00:00',
        },
        {
          ID: 'appt-2',
          PatientId: 'patient-2',
          StartTime: '2025-06-17T11:00:00',
        },
      ];

      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getPatientById
        .mockRejectedValueOnce(new Error('Patient not found'))
        .mockResolvedValueOnce({
          ID: 'patient-2',
          FirstName: 'TestPatient',
          LastName: 'Beta',
          DateOfBirth: '1975-01-01',
        });
      mockTebra.getProviders.mockResolvedValue([]);

      const result = await syncSchedule(deps);

      expect(result).toBe(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to process appointment',
        expect.objectContaining({
          appt: mockAppointments[0],
          err: expect.any(Error),
        })
      );
    });

    it('should handle appointments with missing patient ID', async () => {
      const mockAppointments = [
        {
          ID: 'appt-1',
          // Missing PatientId
          StartTime: '2025-06-17T10:00:00',
        },
        {
          ID: 'appt-2',
          PatientId: 'patient-2',
          StartTime: '2025-06-17T11:00:00',
        },
      ];

      mockTebra.getAppointments.mockResolvedValue(mockAppointments);
      mockTebra.getPatientById.mockResolvedValue({
        ID: 'patient-2',
        FirstName: 'TestPatient',
        LastName: 'Beta',
        DateOfBirth: '1975-01-01',
      });
      mockTebra.getProviders.mockResolvedValue([]);

      const result = await syncSchedule(deps);

      expect(result).toBe(1);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle Tebra API errors gracefully', async () => {
      mockTebra.getAppointments.mockRejectedValue(new Error('API Error'));

      await expect(syncSchedule(deps)).rejects.toThrow('API Error');
    });
  });

  describe('Data transformation and validation', () => {
    it('should correctly map appointment statuses', async () => {
      const statusTests = [
        { tebraStatus: 'Confirmed', expectedStatus: 'scheduled' },
        { tebraStatus: 'CheckedIn', expectedStatus: 'arrived' },
        { tebraStatus: 'InRoom', expectedStatus: 'appt-prep' },
        { tebraStatus: 'CheckedOut', expectedStatus: 'completed' },
        { tebraStatus: 'Cancelled', expectedStatus: 'cancelled' },
        { tebraStatus: 'NoShow', expectedStatus: 'no-show' },
        { tebraStatus: 'Unknown', expectedStatus: 'scheduled' },
      ];

      for (const { tebraStatus, expectedStatus } of statusTests) {
        jest.clearAllMocks();
        
        mockTebra.getAppointments.mockResolvedValue([{
          ID: 'appt-1',
          PatientId: 'patient-1',
          Status: tebraStatus,
          StartTime: '2025-06-17T10:00:00',
        }]);
        
        mockTebra.getPatientById.mockResolvedValue({
          ID: 'patient-1',
          FirstName: 'Test',
          LastName: 'Patient',
        });
        
        mockTebra.getProviders.mockResolvedValue([]);

        await syncSchedule(deps);

        expect(mockRepo.save).toHaveBeenCalledWith(
          expect.any(String),
          expect.arrayContaining([
            expect.objectContaining({
              status: expectedStatus,
            }),
          ]),
          expect.any(String)
        );
      }
    });

    it('should handle various date formats from Tebra', async () => {
      const mockAppointment = {
        ID: 'appt-1',
        PatientId: 'patient-1',
        StartTime: '2025-06-17T10:00:00',
        EndTime: '2025-06-17T10:30:00',
      };

      const mockPatient = {
        ID: 'patient-1',
        FirstName: 'TestPatient',
        LastName: 'Alpha',
        DateOfBirth: '01/01/1980', // Different date format
      };

      mockTebra.getAppointments.mockResolvedValue([mockAppointment]);
      mockTebra.getPatientById.mockResolvedValue(mockPatient);
      mockTebra.getProviders.mockResolvedValue([]);

      const result = await syncSchedule(deps);

      expect(result).toBe(1);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            dob: expect.any(String),
          }),
        ]),
        expect.any(String)
      );
    });

    it('should sanitize patient data properly', async () => {
      const mockAppointment = {
        ID: 'appt-1',
        PatientId: 'patient-1',
        StartTime: '2025-06-17T10:00:00',
      };

      const mockPatient = {
        ID: 'patient-1',
        PatientId: 'patient-1',
        FirstName: '  TestPatient  ',
        LastName: '  Alpha  ',
        Email: '  test.patient.alpha@example.local  ',
        Phone: '+1 (000) 000-0001',
      };

      mockTebra.getAppointments.mockResolvedValue([mockAppointment]);
      mockTebra.getPatientById.mockResolvedValue(mockPatient);
      mockTebra.getProviders.mockResolvedValue([]);

      await syncSchedule(deps);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TestPatient Alpha', // Trimmed
            email: 'test.patient.alpha@example.local', // Trimmed
            phone: '+1 (000) 000-0001', // Original format preserved in mapper
          }),
        ]),
        expect.any(String)
      );
    });
  });
});