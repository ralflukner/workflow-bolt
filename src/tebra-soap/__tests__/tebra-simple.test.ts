/**
 * @fileoverview Simplified tests for Tebra integration
 * @module services/tebra/__tests__/tebra-simple.test
 */

// Mock problematic imports first
jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
  functions: {}
}));

jest.mock('../../services/firebase/dailySessionService');

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TebraApiService } from '../tebra-api-service';
import { createTebraConfig } from '../tebra-integration-service';
import { TebraCredentials } from '../tebra-api-service.types';

describe('Tebra Integration - Simplified Tests', () => {
  const testCredentials: TebraCredentials = {
    username: 'test-user',
    password: 'test-password',
    wsdlUrl: 'https://test.example.com/wsdl'
  };

  describe('TebraApiService - Basic Functionality', () => {
    it('should create an instance with valid credentials', () => {
      const apiService = new TebraApiService(testCredentials);
      expect(apiService).toBeInstanceOf(TebraApiService);
    });

    it('should throw error for invalid credentials', () => {
      // Clear environment variables to ensure test isolation
      const originalEnv = process.env;
      process.env = {};
      
      try {
        expect(() => new TebraApiService({})).toThrow('Invalid Tebra configuration');
      } finally {
        process.env = originalEnv;
      }
    });

    it('should have required methods available', () => {
      const apiService = new TebraApiService(testCredentials);
      
      expect(typeof apiService.getPatientData).toBe('function');
      expect(typeof apiService.getAppointmentData).toBe('function');
      expect(typeof apiService.getDailySessionData).toBe('function');
      expect(typeof apiService.testConnection).toBe('function');
    });

    it('should have rate limiter utility methods', () => {
      const apiService = new TebraApiService(testCredentials);
      
      expect(typeof apiService.getRateLimiterStats).toBe('function');
      expect(typeof apiService.canCallMethodImmediately).toBe('function');
      expect(typeof apiService.getRemainingWaitTime).toBe('function');
    });
  });

  describe('Configuration', () => {
    it('should create valid default configuration', () => {
      const config = createTebraConfig(testCredentials);
      
      expect(config).toBeDefined();
      expect(config.credentials).toEqual(testCredentials);
      expect(typeof config.syncInterval).toBe('number');
      expect(typeof config.lookAheadDays).toBe('number');
      expect(typeof config.autoSync).toBe('boolean');
      expect(typeof config.fallbackToMockData).toBe('boolean');
    });

    it('should accept custom configuration overrides', () => {
      const customConfig = {
        syncInterval: 30,
        lookAheadDays: 7,
        autoSync: false,
        fallbackToMockData: false
      };
      
      const config = createTebraConfig(testCredentials, customConfig);
      
      expect(config.syncInterval).toBe(30);
      expect(config.lookAheadDays).toBe(7);
      expect(config.autoSync).toBe(false);
      expect(config.fallbackToMockData).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should enforce proper credential types', () => {
      const validCredentials: TebraCredentials = {
        username: 'test',
        password: 'test',
        wsdlUrl: 'https://test.com'
      };
      
      expect(() => new TebraApiService(validCredentials)).not.toThrow();
    });
  });
});