/**
 * Verify Command Unit Tests
 * Tests for dashboard verification and state validation functionality
 */

import { VerifyCommand } from '../../../commands/verify';
import { BrowserController } from '../../../lib/BrowserController';
import { DashboardState, VerificationResult } from '../../../../types/cli';

// Mock dependencies
jest.mock('../../../lib/BrowserController');
jest.mock('fs');
jest.mock('path');

const mockBrowserController = BrowserController as jest.MockedClass<typeof BrowserController>;

describe('VerifyCommand Unit Tests', () => {
  let command: VerifyCommand;
  let mockBrowser: jest.Mocked<BrowserController>;

  beforeEach(() => {
    command = new VerifyCommand([], {} as any);
    mockBrowser = {
      initialize: jest.fn(),
      navigateTo: jest.fn(),
      getDashboardState: jest.fn(),
      takeScreenshot: jest.fn(),
      cleanup: jest.fn(),
    } as any;
    mockBrowserController.mockImplementation(() => mockBrowser);
    jest.clearAllMocks();
  });

  describe('Flag Validation', () => {
    it('should validate dashboard URL format', async () => {
      const validUrls = [
        'http://localhost:3000',
        'https://app.example.com',
        'http://127.0.0.1:5173'
      ];
      
      for (const url of validUrls) {
        const flags = { url };
        await expect(command.validateFlags(flags as any)).resolves.not.toThrow();
      }
    });

    it('should reject invalid URL formats', async () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid.com',
        'localhost:3000',
        ''
      ];
      
      for (const url of invalidUrls) {
        const flags = { url };
        await expect(command.validateFlags(flags as any)).rejects.toThrow('Invalid URL format');
      }
    });

    it('should validate expected patients parameter', async () => {
      const flags = { url: 'http://localhost:3000', expectedPatients: -5 };
      
      await expect(command.validateFlags(flags as any)).rejects.toThrow('Expected patients must be non-negative');
    });

    it('should validate timeout parameter', async () => {
      const flags = { url: 'http://localhost:3000', timeout: 0 };
      
      await expect(command.validateFlags(flags as any)).rejects.toThrow('Timeout must be positive');
    });
  });

  describe('Dashboard State Retrieval', () => {
    it('should retrieve dashboard state successfully', async () => {
      const expectedState: DashboardState = {
        totalPatients: 15,
        patientsByStatus: {
          scheduled: 5,
          arrived: 3,
          'appt-prep': 2,
          'ready-for-md': 2,
          'With Doctor': 2,
          'seen-by-md': 1,
          completed: 0
        },
        metrics: {
          averageWaitTime: 12.5,
          totalWaitTime: 187.5,
          patientsSeenToday: 8,
          appointmentsRemaining: 7
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      mockBrowser.getDashboardState.mockResolvedValue(expectedState);
      
      const flags = { url: 'http://localhost:3000' };
      const state = await command.retrieveDashboardState(flags as any);
      
      expect(state).toEqual(expectedState);
      expect(mockBrowser.navigateTo).toHaveBeenCalledWith('http://localhost:3000');
    });

    it('should handle browser initialization failure', async () => {
      mockBrowser.initialize.mockRejectedValue(new Error('Browser launch failed'));
      
      const flags = { url: 'http://localhost:3000' };
      
      await expect(command.retrieveDashboardState(flags as any)).rejects.toThrow('Browser launch failed');
    });

    it('should handle navigation timeout', async () => {
      mockBrowser.navigateTo.mockRejectedValue(new Error('Navigation timeout'));
      
      const flags = { url: 'http://localhost:3000', timeout: 5000 };
      
      await expect(command.retrieveDashboardState(flags as any)).rejects.toThrow('Navigation timeout');
    });

    it('should handle dashboard state extraction failure', async () => {
      mockBrowser.getDashboardState.mockRejectedValue(new Error('Failed to extract state'));
      
      const flags = { url: 'http://localhost:3000' };
      
      await expect(command.retrieveDashboardState(flags as any)).rejects.toThrow('Failed to extract state');
    });
  });

  describe('State Validation', () => {
    it('should validate patient count expectations', () => {
      const state: DashboardState = {
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 6,
          arrived: 2,
          'appt-prep': 1,
          'ready-for-md': 1,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 8.0,
          totalWaitTime: 80.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 10
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      const flags = { expectedPatients: 10 };
      const result = command.validateState(state, flags as any);
      
      expect(result.success).toBe(true);
      expect(result.patientCountValid).toBe(true);
    });

    it('should detect patient count mismatch', () => {
      const state: DashboardState = {
        totalPatients: 8,
        patientsByStatus: {
          scheduled: 4,
          arrived: 2,
          'appt-prep': 1,
          'ready-for-md': 1,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 6.0,
          totalWaitTime: 48.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 8
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      const flags = { expectedPatients: 12 };
      const result = command.validateState(state, flags as any);
      
      expect(result.success).toBe(false);
      expect(result.patientCountValid).toBe(false);
      expect(result.errors).toContain('Patient count mismatch: expected 12, got 8');
    });

    it('should validate status distribution consistency', () => {
      const state: DashboardState = {
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 4,
          arrived: 2,
          'appt-prep': 2,
          'ready-for-md': 1,
          'With Doctor': 1,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 10.0,
          totalWaitTime: 100.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 10
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      const result = command.validateState(state, {} as any);
      
      expect(result.success).toBe(true);
      expect(result.statusDistributionValid).toBe(true);
      
      // Sum of status counts should equal total patients
      const statusSum = Object.values(state.patientsByStatus).reduce((sum, count) => sum + count, 0);
      expect(statusSum).toBe(state.totalPatients);
    });

    it('should detect inconsistent status distribution', () => {
      const state: DashboardState = {
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 4,
          arrived: 2,
          'appt-prep': 2,
          'ready-for-md': 1,
          'With Doctor': 1,
          'seen-by-md': 2, // This makes the sum 12, not 10
          completed: 0
        },
        metrics: {
          averageWaitTime: 10.0,
          totalWaitTime: 100.0,
          patientsSeenToday: 2,
          appointmentsRemaining: 8
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      const result = command.validateState(state, {} as any);
      
      expect(result.success).toBe(false);
      expect(result.statusDistributionValid).toBe(false);
      expect(result.errors).toContain('Status distribution inconsistent with total patient count');
    });

    it('should validate metrics consistency', () => {
      const state: DashboardState = {
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 5,
          arrived: 2,
          'appt-prep': 1,
          'ready-for-md': 1,
          'With Doctor': 0,
          'seen-by-md': 1,
          completed: 0
        },
        metrics: {
          averageWaitTime: 15.0,
          totalWaitTime: 120.0, // Should be 8 * 15.0 = 120.0 for 8 waiting patients
          patientsSeenToday: 1,
          appointmentsRemaining: 9
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      const result = command.validateState(state, {} as any);
      
      expect(result.success).toBe(true);
      expect(result.metricsValid).toBe(true);
    });
  });

  describe('Screenshot Functionality', () => {
    it('should capture screenshot when enabled', async () => {
      const screenshotPath = '/tmp/verify-screenshot-123.png';
      mockBrowser.takeScreenshot.mockResolvedValue(screenshotPath);
      
      const flags = { url: 'http://localhost:3000', screenshot: true };
      const result = await command.captureScreenshot(flags as any);
      
      expect(result).toBe(screenshotPath);
      expect(mockBrowser.takeScreenshot).toHaveBeenCalled();
    });

    it('should skip screenshot when disabled', async () => {
      const flags = { url: 'http://localhost:3000', screenshot: false };
      const result = await command.captureScreenshot(flags as any);
      
      expect(result).toBeNull();
      expect(mockBrowser.takeScreenshot).not.toHaveBeenCalled();
    });

    it('should handle screenshot capture failure', async () => {
      mockBrowser.takeScreenshot.mockRejectedValue(new Error('Screenshot failed'));
      
      const flags = { url: 'http://localhost:3000', screenshot: true };
      
      await expect(command.captureScreenshot(flags as any)).rejects.toThrow('Screenshot failed');
    });
  });

  describe('Verification Result Generation', () => {
    it('should generate comprehensive verification result', () => {
      const state: DashboardState = {
        totalPatients: 15,
        patientsByStatus: {
          scheduled: 6,
          arrived: 3,
          'appt-prep': 2,
          'ready-for-md': 2,
          'With Doctor': 1,
          'seen-by-md': 1,
          completed: 0
        },
        metrics: {
          averageWaitTime: 18.5,
          totalWaitTime: 259.0,
          patientsSeenToday: 1,
          appointmentsRemaining: 14
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: ['Some patients have been waiting over 20 minutes']
      };

      const flags = { expectedPatients: 15 };
      const result = command.generateVerificationResult(state, flags as any);
      
      expect(result).toMatchObject({
        success: true,
        dashboardUrl: expect.any(String),
        totalPatients: 15,
        patientCountValid: true,
        statusDistributionValid: true,
        metricsValid: true,
        errors: [],
        warnings: state.warnings,
        timestamp: expect.any(String),
        executionTime: expect.any(Number)
      });
    });

    it('should include performance metrics in result', () => {
      const state: DashboardState = {
        totalPatients: 5,
        patientsByStatus: {
          scheduled: 3,
          arrived: 1,
          'appt-prep': 1,
          'ready-for-md': 0,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 5.0,
          totalWaitTime: 20.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 5
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      const startTime = Date.now();
      const flags = { expectedPatients: 5 };
      const result = command.generateVerificationResult(state, flags as any);
      
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics?.verificationStartTime).toBeCloseTo(startTime, -2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      mockBrowser.navigateTo.mockRejectedValue(new Error('ECONNREFUSED'));
      
      const flags = { url: 'http://localhost:3000' };
      
      await expect(command.retrieveDashboardState(flags as any)).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle browser crashes gracefully', async () => {
      mockBrowser.getDashboardState.mockRejectedValue(new Error('Browser process crashed'));
      
      const flags = { url: 'http://localhost:3000' };
      
      await expect(command.retrieveDashboardState(flags as any)).rejects.toThrow('Browser process crashed');
      expect(mockBrowser.cleanup).toHaveBeenCalled();
    });

    it('should validate dashboard state format', () => {
      const invalidState = {
        // Missing required fields
        totalPatients: 'not-a-number',
        patientsByStatus: null
      } as any;

      const flags = { expectedPatients: 10 };
      
      expect(() => command.validateState(invalidState, flags as any))
        .toThrow('Invalid dashboard state format');
    });
  });

  describe('Resource Management', () => {
    it('should cleanup browser resources after verification', async () => {
      const state: DashboardState = {
        totalPatients: 5,
        patientsByStatus: {
          scheduled: 5,
          arrived: 0,
          'appt-prep': 0,
          'ready-for-md': 0,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 0,
          totalWaitTime: 0,
          patientsSeenToday: 0,
          appointmentsRemaining: 5
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      mockBrowser.getDashboardState.mockResolvedValue(state);
      
      const flags = { url: 'http://localhost:3000' };
      await command.retrieveDashboardState(flags as any);
      
      expect(mockBrowser.cleanup).toHaveBeenCalled();
    });

    it('should cleanup even when verification fails', async () => {
      mockBrowser.getDashboardState.mockRejectedValue(new Error('Verification failed'));
      
      const flags = { url: 'http://localhost:3000' };
      
      try {
        await command.retrieveDashboardState(flags as any);
      } catch (error) {
        // Expected to throw
      }
      
      expect(mockBrowser.cleanup).toHaveBeenCalled();
    });
  });
});

// Helper class to access private methods for testing
class TestableVerifyCommand extends VerifyCommand {
  public validateFlags(flags: any) {
    return super.validateFlags(flags);
  }
  
  public retrieveDashboardState(flags: any) {
    return super.retrieveDashboardState(flags);
  }
  
  public validateState(state: DashboardState, flags: any) {
    return super.validateState(state, flags);
  }
  
  public captureScreenshot(flags: any) {
    return super.captureScreenshot(flags);
  }
  
  public generateVerificationResult(state: DashboardState, flags: any) {
    return super.generateVerificationResult(state, flags);
  }
}