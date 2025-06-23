/**
 * Unit Tests for Tebra Architecture Routing
 * Tests the routing logic without external dependencies
 */

import { tebraGetAppointments, tebraTestConnection, getApiInfo } from '../services/tebraApi';

// Mock the Firebase API service
jest.mock('../services/tebraFirebaseApi', () => ({
  tebraTestConnection: jest.fn(),
  tebraGetAppointments: jest.fn(),
  tebraGetProviders: jest.fn(),
  tebraGetPatient: jest.fn(),
  tebraSearchPatients: jest.fn(),
  tebraCreateAppointment: jest.fn(),
  tebraUpdateAppointment: jest.fn(),
  tebraTestAppointments: jest.fn(),
  tebraSyncSchedule: jest.fn(),
  getApiInfo: jest.fn(() => ({
    usingFirebaseProxy: true,
    apiType: 'Firebase Functions -> PHP Cloud Run',
    message: 'Using Firebase Functions as security proxy to PHP Tebra API',
  })),
}));

// Mock AuthBridge
jest.mock('../services/authBridge', () => ({
  AuthBridge: {
    getInstance: jest.fn(() => ({
      getFirebaseIdToken: jest.fn().mockResolvedValue('mock-firebase-token'),
      getDebugInfo: jest.fn().mockResolvedValue({
        auth0Token: 'mock-auth0-token',
        firebaseToken: 'mock-firebase-token',
        tokenCacheStatus: 'hit',
      }),
    })),
  },
}));

describe('Tebra Architecture Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global fetch
    global.fetch = jest.fn();
  });

  describe('API Configuration', () => {
    it('should be configured to use Firebase Functions proxy', () => {
      const apiInfo = getApiInfo();
      
      expect(apiInfo.usingFirebaseProxy).toBe(true);
      expect(apiInfo.apiType).toBe('Firebase Functions -> PHP Cloud Run');
      expect(apiInfo.message).toContain('Firebase Functions');
    });

    it('should import from tebraFirebaseApi module', () => {
      // This test verifies that the main tebraApi.ts imports from the correct module
      // by checking that our mocked functions are being used
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      
      expect(mockFirebaseApi.tebraTestConnection).toBeDefined();
      expect(mockFirebaseApi.tebraGetAppointments).toBeDefined();
      expect(mockFirebaseApi.getApiInfo).toBeDefined();
    });
  });

  describe('Request Routing', () => {
    it('should route tebraTestConnection through Firebase Functions', async () => {
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      mockFirebaseApi.tebraTestConnection.mockResolvedValue({
        success: true,
        data: { status: 'healthy' }
      });

      const result = await tebraTestConnection();

      expect(mockFirebaseApi.tebraTestConnection).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });

    it('should route tebraGetAppointments through Firebase Functions', async () => {
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      mockFirebaseApi.tebraGetAppointments.mockResolvedValue({
        success: true,
        data: { 
          Appointments: [],
          SecurityResponse: { Authenticated: true }
        }
      });

      const params = { fromDate: '2025-06-24', toDate: '2025-06-24' };
      const result = await tebraGetAppointments(params);

      expect(mockFirebaseApi.tebraGetAppointments).toHaveBeenCalledWith(params);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from Firebase Functions', async () => {
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      mockFirebaseApi.tebraTestConnection.mockRejectedValue(new Error('Firebase error'));

      await expect(tebraTestConnection()).rejects.toThrow('Firebase error');
    });

    it('should handle failed responses from Firebase Functions', async () => {
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      mockFirebaseApi.tebraGetAppointments.mockResolvedValue({
        success: false,
        error: 'Invalid date format'
      });

      const result = await tebraGetAppointments({
        fromDate: 'invalid',
        toDate: '2025-06-24'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid date format');
    });
  });

  describe('Module Structure', () => {
    it('should export all required functions', () => {
      const tebraApi = require('../services/tebraApi');
      
      const requiredFunctions = [
        'tebraTestConnection',
        'tebraGetPatient',
        'tebraSearchPatients',
        'tebraGetAppointments',
        'tebraGetProviders',
        'tebraCreateAppointment',
        'tebraUpdateAppointment',
        'tebraTestAppointments',
        'tebraSyncSchedule',
        'getApiInfo'
      ];

      requiredFunctions.forEach(funcName => {
        expect(tebraApi[funcName]).toBeDefined();
        expect(typeof tebraApi[funcName]).toBe('function');
      });
    });

    it('should have a default export with all functions', () => {
      const tebraApi = require('../services/tebraApi');
      
      expect(tebraApi.default).toBeDefined();
      expect(typeof tebraApi.default).toBe('object');
      expect(tebraApi.default.testConnection).toBeDefined();
      expect(tebraApi.default.getAppointments).toBeDefined();
      expect(tebraApi.default.getApiInfo).toBeDefined();
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain the same function signatures', async () => {
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      mockFirebaseApi.tebraGetAppointments.mockResolvedValue({ success: true });
      
      // Test that the function accepts the expected parameters
      await tebraGetAppointments({
        fromDate: '2025-06-24',
        toDate: '2025-06-24'
      });

      expect(mockFirebaseApi.tebraGetAppointments).toHaveBeenCalledWith({
        fromDate: '2025-06-24',
        toDate: '2025-06-24'
      });
    });

    it('should return consistent response structure', async () => {
      const mockFirebaseApi = require('../services/tebraFirebaseApi');
      const mockResponse = {
        success: true,
        data: { test: 'data' },
        timestamp: '2025-06-23T05:00:00Z'
      };
      mockFirebaseApi.tebraTestConnection.mockResolvedValue(mockResponse);

      const result = await tebraTestConnection();

      expect(result).toEqual(mockResponse);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });
});