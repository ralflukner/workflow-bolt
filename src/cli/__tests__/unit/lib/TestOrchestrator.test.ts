/**
 * TestOrchestrator Unit Tests
 * Tests for the core test orchestration and coordination functionality
 */

import { TestOrchestrator } from '../../../lib/TestOrchestrator';
import { BrowserController } from '../../../lib/BrowserController';
import { TestConfig, TestResult, ImportMode } from '../../../../types/cli';

// Mock dependencies
jest.mock('../../../lib/BrowserController');
jest.mock('fs');
jest.mock('path');

const mockBrowserController = BrowserController as jest.MockedClass<typeof BrowserController>;

describe('TestOrchestrator Unit Tests', () => {
  let orchestrator: TestOrchestrator;
  let mockBrowser: jest.Mocked<BrowserController>;

  beforeEach(() => {
    orchestrator = new TestOrchestrator();
    mockBrowser = {
      initialize: jest.fn(),
      navigateTo: jest.fn(),
      uploadFile: jest.fn(),
      getDashboardState: jest.fn(),
      takeScreenshot: jest.fn(),
      cleanup: jest.fn(),
    } as any;
    mockBrowserController.mockImplementation(() => mockBrowser);
    jest.clearAllMocks();
  });

  describe('Test Configuration Validation', () => {
    it('should validate required config fields', () => {
      const invalidConfigs = [
        {}, // Empty config
        { mode: 'megaparse' }, // Missing other required fields
        { mode: 'megaparse', format: 'lukner' }, // Missing expectedPatients, etc.
      ];

      invalidConfigs.forEach(config => {
        expect(() => orchestrator.validateTestConfig(config as TestConfig))
          .toThrow('Invalid test configuration');
      });
    });

    it('should validate import mode values', () => {
      const validModes: ImportMode[] = ['megaparse', 'secure', 'legacy'];
      
      validModes.forEach(mode => {
        const config: TestConfig = {
          mode,
          format: 'lukner',
          expectedPatients: 10,
          timeout: 60000,
          verifyDashboard: true,
          outputDir: './output'
        };
        
        expect(() => orchestrator.validateTestConfig(config)).not.toThrow();
      });
    });

    it('should reject invalid import modes', () => {
      const config = {
        mode: 'invalid-mode' as ImportMode,
        format: 'lukner',
        expectedPatients: 10,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: './output'
      };

      expect(() => orchestrator.validateTestConfig(config))
        .toThrow('Invalid import mode');
    });

    it('should validate timeout values', () => {
      const config: TestConfig = {
        mode: 'megaparse',
        format: 'lukner',
        expectedPatients: 10,
        timeout: -1000, // Invalid negative timeout
        verifyDashboard: true,
        outputDir: './output'
      };

      expect(() => orchestrator.validateTestConfig(config))
        .toThrow('Timeout must be positive');
    });

    it('should validate expected patients count', () => {
      const config: TestConfig = {
        mode: 'megaparse',
        format: 'lukner',
        expectedPatients: -5, // Invalid negative count
        timeout: 60000,
        verifyDashboard: true,
        outputDir: './output'
      };

      expect(() => orchestrator.validateTestConfig(config))
        .toThrow('Expected patients must be non-negative');
    });
  });

  describe('Import Test Execution', () => {
    const validConfig: TestConfig = {
      mode: 'megaparse',
      format: 'lukner',
      expectedPatients: 10,
      timeout: 60000,
      verifyDashboard: true,
      outputDir: './output',
      inputFile: 'test-schedule.csv'
    };

    it('should execute successful import test', async () => {
      // Mock successful browser operations
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 8,
          arrived: 2,
          'appt-prep': 0,
          'ready-for-md': 0,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 5.0,
          totalWaitTime: 50.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 10
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.success).toBe(true);
      expect(result.patientsImported).toBe(10);
      expect(result.patientsExpected).toBe(10);
      expect(result.dashboardVerified).toBe(true);
      expect(result.mode).toBe('megaparse');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle browser initialization failure', async () => {
      mockBrowser.initialize.mockRejectedValue(new Error('Browser failed to start'));

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Browser failed to start');
      expect(result.patientsImported).toBe(0);
    });

    it('should handle file upload failure', async () => {
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(false);

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('File upload failed');
      expect(result.patientsImported).toBe(0);
    });

    it('should handle dashboard verification failure', async () => {
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockRejectedValue(new Error('Failed to read dashboard'));

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to read dashboard');
      expect(result.dashboardVerified).toBe(false);
    });

    it('should handle patient count mismatch', async () => {
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 5, // Less than expected 10
        patientsByStatus: {
          scheduled: 4,
          arrived: 1,
          'appt-prep': 0,
          'ready-for-md': 0,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 3.0,
          totalWaitTime: 15.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 5
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.success).toBe(false);
      expect(result.patientsImported).toBe(5);
      expect(result.patientsExpected).toBe(10);
      expect(result.warnings).toContain('Patient count mismatch: expected 10, imported 5');
    });

    it('should handle timeout scenarios', async () => {
      const shortTimeoutConfig = { ...validConfig, timeout: 100 }; // Very short timeout
      
      mockBrowser.initialize.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200)) // Longer than timeout
      );

      const result = await orchestrator.runImportTest(shortTimeoutConfig);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Test execution timeout');
    });
  });

  describe('Performance Metrics Tracking', () => {
    const validConfig: TestConfig = {
      mode: 'megaparse',
      format: 'lukner',
      expectedPatients: 5,
      timeout: 60000,
      verifyDashboard: true,
      outputDir: './output',
      inputFile: 'test-schedule.csv'
    };

    it('should track import duration accurately', async () => {
      const startTime = Date.now();
      
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );
      mockBrowser.getDashboardState.mockResolvedValue({
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
      });

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.importTime).toBeGreaterThan(100);
      expect(result.metadata.performanceMetrics.importStartTime).toBeCloseTo(startTime, -2);
      expect(result.metadata.performanceMetrics.importEndTime).toBeGreaterThan(startTime);
      expect(result.metadata.performanceMetrics.importDuration).toBe(result.importTime);
    });

    it('should include browser usage in metadata', async () => {
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
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
      });

      const result = await orchestrator.runImportTest(validConfig);

      expect(result.metadata.browserUsed).toBe(true);
      expect(result.metadata.format).toBe('lukner');
    });
  });

  describe('Report Generation', () => {
    it('should generate comprehensive test report', () => {
      const testResult: TestResult = {
        success: true,
        testName: 'Test Import',
        mode: 'megaparse',
        importTime: 2500,
        patientsImported: 15,
        patientsExpected: 15,
        dashboardVerified: true,
        errors: [],
        warnings: ['Patient with very long wait time detected'],
        logs: ['Import started', 'File uploaded', 'Dashboard verified'],
        timestamp: new Date().toISOString(),
        metadata: {
          format: 'lukner',
          browserUsed: true,
          performanceMetrics: {
            importStartTime: Date.now() - 2500,
            importEndTime: Date.now(),
            importDuration: 2500
          }
        }
      };

      const report = orchestrator.generateReport(testResult);

      expect(report).toContain('Test Import');
      expect(report).toContain('SUCCESS');
      expect(report).toContain('15 patients imported');
      expect(report).toContain('2.5 seconds');
      expect(report).toContain('Patient with very long wait time detected');
    });

    it('should generate failure report with errors', () => {
      const testResult: TestResult = {
        success: false,
        testName: 'Failed Import',
        mode: 'secure',
        importTime: 0,
        patientsImported: 0,
        patientsExpected: 20,
        dashboardVerified: false,
        errors: ['File format not recognized', 'Upload timeout'],
        warnings: [],
        logs: ['Import started', 'File validation failed'],
        timestamp: new Date().toISOString(),
        metadata: {
          format: 'unknown',
          browserUsed: false,
          performanceMetrics: {
            importStartTime: Date.now(),
            importEndTime: Date.now(),
            importDuration: 0
          }
        }
      };

      const report = orchestrator.generateReport(testResult);

      expect(report).toContain('Failed Import');
      expect(report).toContain('FAILED');
      expect(report).toContain('0 patients imported');
      expect(report).toContain('File format not recognized');
      expect(report).toContain('Upload timeout');
    });

    it('should include performance analysis in report', () => {
      const slowTestResult: TestResult = {
        success: true,
        testName: 'Slow Import',
        mode: 'legacy',
        importTime: 15000, // 15 seconds - should trigger performance warning
        patientsImported: 5,
        patientsExpected: 5,
        dashboardVerified: true,
        errors: [],
        warnings: [],
        logs: [],
        timestamp: new Date().toISOString(),
        metadata: {
          format: 'tebra',
          browserUsed: true,
          performanceMetrics: {
            importStartTime: Date.now() - 15000,
            importEndTime: Date.now(),
            importDuration: 15000
          }
        }
      };

      const report = orchestrator.generateReport(slowTestResult);

      expect(report).toContain('Performance');
      expect(report).toContain('15.0 seconds');
      // Should include performance warnings for slow imports
    });
  });

  describe('Error Handling and Recovery', () => {
    const validConfig: TestConfig = {
      mode: 'megaparse',
      format: 'lukner',
      expectedPatients: 10,
      timeout: 60000,
      verifyDashboard: true,
      outputDir: './output',
      inputFile: 'test-schedule.csv'
    };

    it('should cleanup resources after successful test', async () => {
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 10,
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
          appointmentsRemaining: 10
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      await orchestrator.runImportTest(validConfig);

      expect(mockBrowser.cleanup).toHaveBeenCalled();
    });

    it('should cleanup resources after failed test', async () => {
      mockBrowser.initialize.mockRejectedValue(new Error('Browser crash'));

      await orchestrator.runImportTest(validConfig);

      expect(mockBrowser.cleanup).toHaveBeenCalled();
    });

    it('should handle multiple consecutive test runs', async () => {
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 10,
        patientsByStatus: {
          scheduled: 10,
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
          appointmentsRemaining: 10
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      // Run multiple tests
      const result1 = await orchestrator.runImportTest(validConfig);
      const result2 = await orchestrator.runImportTest(validConfig);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockBrowser.cleanup).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Modes', () => {
    it('should handle megaparse mode configuration', async () => {
      const megaparseConfig: TestConfig = {
        mode: 'megaparse',
        format: 'lukner',
        expectedPatients: 20,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: './output',
        inputFile: 'large-schedule.csv'
      };

      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 20,
        patientsByStatus: {
          scheduled: 20,
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
          appointmentsRemaining: 20
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      const result = await orchestrator.runImportTest(megaparseConfig);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('megaparse');
      expect(result.patientsImported).toBe(20);
    });

    it('should handle secure mode configuration', async () => {
      const secureConfig: TestConfig = {
        mode: 'secure',
        format: 'tebra',
        expectedPatients: 8,
        timeout: 90000, // Longer timeout for secure mode
        verifyDashboard: true,
        outputDir: './secure-output',
        inputFile: 'hipaa-schedule.csv'
      };

      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 8,
        patientsByStatus: {
          scheduled: 8,
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
          appointmentsRemaining: 8
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      const result = await orchestrator.runImportTest(secureConfig);

      expect(result.success).toBe(true);
      expect(result.mode).toBe('secure');
      expect(result.patientsImported).toBe(8);
    });
  });
});

// Helper class to access private methods for testing
class TestableTestOrchestrator extends TestOrchestrator {
  public validateTestConfig(config: TestConfig) {
    return super.validateTestConfig(config);
  }
}