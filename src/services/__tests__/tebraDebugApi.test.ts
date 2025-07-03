/**
 * Unit tests for TebraDebugApiService
 */

import { TebraDebugApiService, generateCorrelationId, parseApiError } from '../tebraDebugApi';
import { CORRELATION_ID } from '../../constants/tebraConfig';

// Mock the dependencies
jest.mock('../tebraApi', () => ({
  tebraTestConnection: jest.fn(),
  tebraGetAppointments: jest.fn(),
  tebraGetProviders: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
  app: { name: 'test-app' },
  isFirebaseConfigured: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({ name: 'test-functions' })),
}));

jest.mock('../../utils/envUtils', () => ({
  checkFirebaseEnvVars: jest.fn(() => ({ loaded: ['TEST_VAR'], missing: [] })),
}));

jest.mock('../authBridge', () => ({
  AuthBridge: {
    getInstance: jest.fn(() => ({
      getFirebaseIdToken: jest.fn(() => Promise.resolve('test-token')),
    })),
  },
}));

describe('TebraDebugApiService', () => {
  let service: TebraDebugApiService;

  beforeEach(() => {
    service = new TebraDebugApiService();
    jest.clearAllMocks();
  });

  describe('generateCorrelationId', () => {
    it('should generate a correlation ID with correct format', () => {
      const id = generateCorrelationId();
      
      expect(id).toMatch(CORRELATION_ID.FORMAT);
      expect(id).toHaveLength(CORRELATION_ID.PREFIX.length + CORRELATION_ID.LENGTH);
      expect(id.startsWith(CORRELATION_ID.PREFIX)).toBe(true);
    });

    it('should generate unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('parseApiError', () => {
    it('should parse timeout errors', () => {
      const error = new Error('Operation timed out');
      const result = parseApiError(error);
      
      expect(result).toBe('Request timed out - service may be overloaded');
    });

    it('should parse network errors', () => {
      const error = new Error('Network request failed');
      const result = parseApiError(error);
      
      expect(result).toBe('Network connectivity issue');
    });

    it('should parse authentication errors', () => {
      const error = new Error('Authentication failed with 401');
      const result = parseApiError(error);
      
      expect(result).toBe('Authentication failed - token may be expired');
    });

    it('should handle null/undefined errors', () => {
      expect(parseApiError(null)).toBe('Unknown error occurred');
      expect(parseApiError(undefined)).toBe('Unknown error occurred');
    });

    it('should handle non-Error objects', () => {
      expect(parseApiError('string error')).toBe('string error');
      expect(parseApiError({ message: 'object error' })).toBe('[object Object]');
    });
  });

  describe('testFrontendHealth', () => {
    it('should return healthy status in browser environment', async () => {
      // Mock browser environment
      

      const result = await service.testFrontendHealth();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Frontend application running');
      expect(result.correlationId).toMatch(CORRELATION_ID.FORMAT);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('testFirebaseFunctions', () => {
    it('should return healthy status when Firebase is properly configured', async () => {
      const { isFirebaseConfigured } = require('../../config/firebase');
      isFirebaseConfigured.mockReturnValue(true);

      const result = await service.testFirebaseFunctions();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Firebase Functions configured');
      expect(result.correlationId).toMatch(CORRELATION_ID.FORMAT);
    });

    it('should return error status when Firebase is not configured', async () => {
      const { isFirebaseConfigured } = require('../../config/firebase');
      isFirebaseConfigured.mockReturnValue(false);

      const result = await service.testFirebaseFunctions();

      expect(result.status).toBe('error');
      expect(result.message).toBe('Firebase not configured');
    });
  });

  describe('testTebraProxy', () => {
    it('should return healthy status when proxy connection succeeds', async () => {
      const { tebraTestConnection } = require('../tebraApi');
      tebraTestConnection.mockResolvedValue({ success: true });

      const result = await service.testTebraProxy();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Tebra proxy connection successful');
    });

    it('should return error status when authentication fails', async () => {
      const { AuthBridge } = require('../authBridge');
      AuthBridge.getInstance().getFirebaseIdToken.mockResolvedValue(null);

      const result = await service.testTebraProxy();

      expect(result.status).toBe('error');
      expect(result.message).toBe('No authentication token available');
    });
  });

  describe('testTebraApi', () => {
    it('should return healthy status when both providers and appointments succeed', async () => {
      const { tebraGetProviders, tebraGetAppointments } = require('../tebraApi');
      tebraGetProviders.mockResolvedValue({ success: true });
      tebraGetAppointments.mockResolvedValue({ success: true });

      const result = await service.testTebraApi();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Tebra API fully accessible');
    });

    it('should return warning status when only one endpoint succeeds', async () => {
      const { tebraGetProviders, tebraGetAppointments } = require('../tebraApi');
      tebraGetProviders.mockResolvedValue({ success: true });
      tebraGetAppointments.mockRejectedValue(new Error('Appointments failed'));

      const result = await service.testTebraApi();

      expect(result.status).toBe('warning');
      expect(result.message).toBe('Tebra API partially accessible');
    });

    it('should return error status when both endpoints fail', async () => {
      const { tebraGetProviders, tebraGetAppointments } = require('../tebraApi');
      tebraGetProviders.mockRejectedValue(new Error('Providers failed'));
      tebraGetAppointments.mockRejectedValue(new Error('Appointments failed'));

      const result = await service.testTebraApi();

      expect(result.status).toBe('error');
      expect(result.message).toContain('Tebra API unavailable');
    });
  });

  describe('testDataTransform', () => {
    it('should return healthy status for data transformation', async () => {
      const result = await service.testDataTransform();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Data transformation pipeline ready');
      expect(result.duration).toBeGreaterThan(50); // Should include the 50ms delay
    });
  });

  describe('testDashboardUpdate', () => {
    it('should return healthy status for dashboard updates', async () => {
      const result = await service.testDashboardUpdate();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Dashboard update system operational');
      expect(result.details?.operations).toEqual([
        'metrics calculation',
        'error tracking',
        'status updates'
      ]);
    });
  });
});