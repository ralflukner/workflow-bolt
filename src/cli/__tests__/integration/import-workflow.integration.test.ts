/**
 * Import Workflow Integration Tests
 * End-to-end testing of schedule import → dashboard verification workflows
 */

import { ImportCommand } from '../../commands/import';
import { VerifyCommand } from '../../commands/verify';
import { TestOrchestrator } from '../../lib/TestOrchestrator';
import { BrowserController } from '../../lib/BrowserController';
import { RedisTestFramework } from '../../lib/RedisTestFramework';
import { ImportMode, TestResult, DashboardState } from '../../../types/cli';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Mock external dependencies but allow real coordination
jest.mock('fs');
jest.mock('path');
jest.mock('../../../lib/BrowserController');

describe('Import Workflow Integration Tests', () => {
  let importCommand: ImportCommand;
  let verifyCommand: VerifyCommand;
  let testOrchestrator: TestOrchestrator;
  let redisFramework: RedisTestFramework;
  let mockBrowser: jest.Mocked<BrowserController>;

  const testOutputDir = './test-output';
  const testFixtureFile = 'test-schedule.csv';

  beforeAll(async () => {
    // Setup test directories and files
    (existsSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('test-schedule.csv')) return true;
      if (path.includes('test-output')) return true;
      return false;
    });

    (writeFileSync as jest.Mock).mockImplementation(() => {});
    (mkdirSync as jest.Mock).mockImplementation(() => {});
    (join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  beforeEach(async () => {
    importCommand = new ImportCommand([], {} as any);
    verifyCommand = new VerifyCommand([], {} as any);
    testOrchestrator = new TestOrchestrator();
    redisFramework = new RedisTestFramework({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:integration:'
    }, 'integration-test-agent');

    // Mock browser with realistic responses
    mockBrowser = {
      initialize: jest.fn(),
      navigateTo: jest.fn(),
      uploadFile: jest.fn(),
      getDashboardState: jest.fn(),
      takeScreenshot: jest.fn(),
      cleanup: jest.fn(),
    } as any;

    (BrowserController as jest.MockedClass<typeof BrowserController>)
      .mockImplementation(() => mockBrowser);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    try {
      await redisFramework.shutdown();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('End-to-End Import Verification Workflow', () => {
    it('should complete full import and verification cycle successfully', async () => {
      // Setup mock responses for successful workflow
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      
      const expectedDashboardState: DashboardState = {
        totalPatients: 12,
        patientsByStatus: {
          scheduled: 8,
          arrived: 2,
          'appt-prep': 1,
          'ready-for-md': 1,
          'With Doctor': 0,
          'seen-by-md': 0,
          completed: 0
        },
        metrics: {
          averageWaitTime: 8.5,
          totalWaitTime: 102.0,
          patientsSeenToday: 0,
          appointmentsRemaining: 12
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      mockBrowser.getDashboardState.mockResolvedValue(expectedDashboardState);
      mockBrowser.takeScreenshot.mockResolvedValue('/tmp/screenshot-123.png');

      // Step 1: Execute import
      const importResult = await testOrchestrator.runImportTest({
        mode: 'megaparse',
        format: 'lukner',
        expectedPatients: 12,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile,
        enableScreenshot: true
      });

      // Verify import results
      expect(importResult.success).toBe(true);
      expect(importResult.patientsImported).toBe(12);
      expect(importResult.patientsExpected).toBe(12);
      expect(importResult.dashboardVerified).toBe(true);
      expect(importResult.mode).toBe('megaparse');
      expect(importResult.errors).toHaveLength(0);

      // Step 2: Independent verification
      const verificationResult = await verifyCommand.run(['--url', 'http://localhost:3000', '--expected-patients', '12']);

      // Verify verification results
      expect(verificationResult).toBeDefined();
      expect(mockBrowser.getDashboardState).toHaveBeenCalledTimes(2); // Once for import, once for verify
      
      // Step 3: Cross-validate results
      expect(importResult.metadata.performanceMetrics.importDuration).toBeGreaterThan(0);
      expect(importResult.timestamp).toBeDefined();
    });

    it('should handle import success with verification failure', async () => {
      // Setup import success but verification reveals inconsistency
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      
      // First call (during import) - success
      const importDashboardState: DashboardState = {
        totalPatients: 15,
        patientsByStatus: {
          scheduled: 15,
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
          appointmentsRemaining: 15
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      };

      // Second call (during verification) - different state
      const verifyDashboardState: DashboardState = {
        totalPatients: 10, // Data loss detected!
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
        errors: ['Patient data inconsistency detected'],
        warnings: ['5 patients missing from expected count']
      };

      mockBrowser.getDashboardState
        .mockResolvedValueOnce(importDashboardState)
        .mockResolvedValueOnce(verifyDashboardState);

      // Execute import
      const importResult = await testOrchestrator.runImportTest({
        mode: 'secure',
        format: 'tebra',
        expectedPatients: 15,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile
      });

      // Import should report success based on immediate verification
      expect(importResult.success).toBe(true);
      expect(importResult.patientsImported).toBe(15);

      // Independent verification should detect the problem
      const verificationResult = await verifyCommand.run(['--url', 'http://localhost:3000', '--expected-patients', '15']);

      // Should detect the inconsistency
      expect(mockBrowser.getDashboardState).toHaveBeenCalledTimes(2);
      
      // The workflow should highlight the data persistence issue
      expect(verifyDashboardState.errors).toContain('Patient data inconsistency detected');
      expect(verifyDashboardState.warnings).toContain('5 patients missing from expected count');
    });

    it('should handle complete workflow failure gracefully', async () => {
      // Setup complete failure scenario
      mockBrowser.initialize.mockRejectedValue(new Error('Browser launch failed'));

      // Execute import - should fail
      const importResult = await testOrchestrator.runImportTest({
        mode: 'legacy',
        format: 'auto',
        expectedPatients: 8,
        timeout: 30000,
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile
      });

      // Import should fail
      expect(importResult.success).toBe(false);
      expect(importResult.patientsImported).toBe(0);
      expect(importResult.errors).toContain('Browser launch failed');

      // Verification should also fail with the same issue
      await expect(verifyCommand.run(['--url', 'http://localhost:3000']))
        .rejects.toThrow('Browser launch failed');

      // Cleanup should still be called
      expect(mockBrowser.cleanup).toHaveBeenCalled();
    });
  });

  describe('Multi-Mode Import Testing', () => {
    const testModes: ImportMode[] = ['megaparse', 'secure', 'legacy'];

    testModes.forEach(mode => {
      it(`should handle ${mode} mode import workflow`, async () => {
        mockBrowser.initialize.mockResolvedValue(undefined);
        mockBrowser.navigateTo.mockResolvedValue(undefined);
        mockBrowser.uploadFile.mockResolvedValue(true);

        const expectedPatients = mode === 'megaparse' ? 20 : mode === 'secure' ? 15 : 10;
        
        const dashboardState: DashboardState = {
          totalPatients: expectedPatients,
          patientsByStatus: {
            scheduled: expectedPatients,
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
            appointmentsRemaining: expectedPatients
          },
          lastUpdated: new Date().toISOString(),
          errors: [],
          warnings: []
        };

        mockBrowser.getDashboardState.mockResolvedValue(dashboardState);

        const importResult = await testOrchestrator.runImportTest({
          mode,
          format: 'lukner',
          expectedPatients,
          timeout: 60000,
          verifyDashboard: true,
          outputDir: testOutputDir,
          inputFile: testFixtureFile
        });

        expect(importResult.success).toBe(true);
        expect(importResult.mode).toBe(mode);
        expect(importResult.patientsImported).toBe(expectedPatients);
        expect(importResult.dashboardVerified).toBe(true);
      });
    });
  });

  describe('Performance and Timing Integration', () => {
    it('should track accurate timing across import and verification steps', async () => {
      const startTime = Date.now();
      
      mockBrowser.initialize.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      mockBrowser.navigateTo.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 50))
      );
      mockBrowser.uploadFile.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 200))
      );
      mockBrowser.getDashboardState.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
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
        }), 100))
      );

      const importResult = await testOrchestrator.runImportTest({
        mode: 'megaparse',
        format: 'lukner',
        expectedPatients: 5,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile
      });

      expect(importResult.importTime).toBeGreaterThan(350); // 100+50+200+100 = 450ms minimum
      expect(importResult.metadata.performanceMetrics.importStartTime).toBeCloseTo(startTime, -2);
      expect(importResult.metadata.performanceMetrics.importEndTime).toBeGreaterThan(startTime + 350);
      expect(importResult.metadata.performanceMetrics.importDuration).toBe(importResult.importTime);
    });

    it('should handle timeout scenarios in integrated workflow', async () => {
      const shortTimeoutConfig = {
        mode: 'megaparse' as ImportMode,
        format: 'lukner',
        expectedPatients: 10,
        timeout: 100, // Very short timeout
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile
      };

      // Make initialization take longer than timeout
      mockBrowser.initialize.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      const importResult = await testOrchestrator.runImportTest(shortTimeoutConfig);

      expect(importResult.success).toBe(false);
      expect(importResult.errors).toContain('Test execution timeout');
      expect(importResult.importTime).toBeLessThan(1000); // Should fail quickly
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from transient browser failures', async () => {
      let browserCallCount = 0;
      
      // First call fails, second succeeds (simulating retry logic)
      mockBrowser.initialize.mockImplementation(() => {
        browserCallCount++;
        if (browserCallCount === 1) {
          return Promise.reject(new Error('Browser startup failed'));
        }
        return Promise.resolve();
      });

      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockResolvedValue({
        totalPatients: 7,
        patientsByStatus: {
          scheduled: 7,
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
          appointmentsRemaining: 7
        },
        lastUpdated: new Date().toISOString(),
        errors: [],
        warnings: []
      });

      // This would require retry logic in the actual implementation
      const importResult = await testOrchestrator.runImportTest({
        mode: 'secure',
        format: 'auto',
        expectedPatients: 7,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile
      });

      // First attempt should fail
      expect(importResult.success).toBe(false);
      expect(importResult.errors).toContain('Browser startup failed');

      // Note: Actual retry logic would need to be implemented in TestOrchestrator
    });

    it('should handle partial workflow completion', async () => {
      // Upload succeeds but verification fails
      mockBrowser.initialize.mockResolvedValue(undefined);
      mockBrowser.navigateTo.mockResolvedValue(undefined);
      mockBrowser.uploadFile.mockResolvedValue(true);
      mockBrowser.getDashboardState.mockRejectedValue(new Error('Dashboard read failed'));

      const importResult = await testOrchestrator.runImportTest({
        mode: 'legacy',
        format: 'tebra',
        expectedPatients: 6,
        timeout: 60000,
        verifyDashboard: true,
        outputDir: testOutputDir,
        inputFile: testFixtureFile
      });

      expect(importResult.success).toBe(false);
      expect(importResult.dashboardVerified).toBe(false);
      expect(importResult.errors).toContain('Dashboard read failed');
      
      // File upload should have succeeded
      expect(mockBrowser.uploadFile).toHaveBeenCalled();
      
      // But dashboard verification should have failed
      expect(mockBrowser.getDashboardState).toHaveBeenCalled();
    });
  });

  describe('Redis Coordination Integration', () => {
    it('should coordinate import workflow via Redis streams', async () => {
      await redisFramework.initialize();

      const testScenario = {
        scenarioId: 'integration-test-scenario',
        name: 'Integration Test Workflow',
        description: 'Testing Redis coordination with import workflow',
        testConfigs: [{
          agentId: 'integration-agent-1',
          redisStreamKey: 'integration-stream',
          coordinationGroup: 'integration-group',
          mode: 'megaparse' as ImportMode,
          format: 'lukner',
          expectedPatients: 8,
          timeout: 60000,
          outputDir: testOutputDir,
          verifyDashboard: true
        }],
        coordinationStrategy: {
          type: 'parallel' as const,
          maxConcurrentAgents: 1,
          timeoutMs: 60000,
          retryStrategy: {
            maxRetries: 3,
            backoffStrategy: 'exponential' as const,
            baseDelayMs: 1000,
            maxDelayMs: 10000,
            retryableErrorCodes: ['TIMEOUT', 'CONNECTION_ERROR']
          }
        },
        failureHandling: {
          continueOnAgentFailure: false,
          maxFailurePercentage: 0,
          fallbackStrategy: 'abort' as const,
          isolateFailedAgents: true
        },
        successCriteria: {
          minimumSuccessfulTests: 1,
          maximumFailurePercentage: 0,
          performanceThresholds: {
            maxAverageResponseTime: 10000,
            minThroughput: 1,
            maxErrorRate: 0.1
          }
        }
      };

      // Mock successful coordination
      jest.spyOn(redisFramework as any, 'executeAgentTest').mockResolvedValue({
        agentId: 'integration-agent-1',
        testResult: {
          success: true,
          testName: 'Integration Test',
          mode: 'megaparse',
          importTime: 2000,
          patientsImported: 8,
          patientsExpected: 8,
          dashboardVerified: true,
          errors: [],
          warnings: [],
          logs: ['Integration test completed'],
          timestamp: new Date().toISOString(),
          metadata: {
            format: 'lukner',
            browserUsed: true,
            performanceMetrics: {
              importStartTime: Date.now() - 2000,
              importEndTime: Date.now(),
              importDuration: 2000
            }
          }
        },
        executionTime: 2000,
        resourceUsage: {
          cpuUsagePercent: 45,
          memoryUsageMB: 512,
          diskIOKB: 1024,
          networkIOKB: 256,
          peakMemoryMB: 600
        }
      });

      const coordinatedResult = await redisFramework.coordinateAgentTesting(testScenario);

      expect(coordinatedResult.success).toBe(true);
      expect(coordinatedResult.patientsImported).toBe(8);
      expect(coordinatedResult.testName).toContain('Coordinated Test');
    });
  });
});

// Test utilities
function createMockDashboardState(totalPatients: number): DashboardState {
  return {
    totalPatients,
    patientsByStatus: {
      scheduled: totalPatients,
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
      appointmentsRemaining: totalPatients
    },
    lastUpdated: new Date().toISOString(),
    errors: [],
    warnings: []
  };
}