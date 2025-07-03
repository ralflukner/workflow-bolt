/**
 * Redis Test Framework Integration Tests
 * Tests the integration between Redis Streams and CLI testing infrastructure
 */

// Mock all external dependencies first
jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    hset: jest.fn().mockResolvedValue(1),
    sadd: jest.fn().mockResolvedValue(1),
    srem: jest.fn().mockResolvedValue(1),
    del: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    scard: jest.fn().mockResolvedValue(0),
    xgroup: jest.fn().mockResolvedValue('OK'),
    xreadgroup: jest.fn().mockResolvedValue([]),
    xadd: jest.fn().mockResolvedValue('1234567890-0'),
    xrevrange: jest.fn().mockResolvedValue([['1234567890-0', ['progress', '50', 'stage', 'importing']]]),
    xack: jest.fn().mockResolvedValue(1),
    on: jest.fn()
  }))
}));

jest.mock('../../cli/lib/TestOrchestrator', () => ({
  TestOrchestrator: jest.fn().mockImplementation(() => ({
    runImportTest: jest.fn().mockResolvedValue({
      success: true,
      testName: 'Mock Test',
      mode: 'megaparse',
      importTime: 1500,
      patientsImported: 10,
      patientsExpected: 10,
      dashboardVerified: false,
      errors: [],
      warnings: [],
      logs: ['Mock test executed'],
      timestamp: new Date().toISOString(),
      metadata: {
        format: 'lukner',
        browserUsed: false,
        performanceMetrics: {
          importStartTime: Date.now() - 1500,
          importEndTime: Date.now(),
          importDuration: 1500
        }
      }
    })
  }))
}));

import { RedisTestFramework, TestScenario, RedisTestConfig } from '../../cli/lib/RedisTestFramework';
import { ImportMode } from '../../types/cli';

describe('Redis Test Framework Integration', () => {
  let redisFramework: RedisTestFramework;

  beforeEach(() => {
    // Create framework instance with mock configuration
    redisFramework = new RedisTestFramework({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test:workflow-bolt:testing:'
    }, 'test-agent');
  });

  afterEach(async () => {
    try {
      await redisFramework.shutdown();
    } catch (error) {
      // Ignore shutdown errors in tests
    }
  });

  describe('Framework Initialization', () => {
    it('should initialize Redis Test Framework successfully', async () => {
      await expect(redisFramework.initialize()).resolves.not.toThrow();
    });

    it('should get health status after initialization', async () => {
      await redisFramework.initialize();
      
      const healthStatus = await redisFramework.getHealthStatus();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus).toHaveProperty('redis');
      expect(healthStatus).toHaveProperty('framework');
      expect(healthStatus).toHaveProperty('activeTests');
      expect(healthStatus).toHaveProperty('registeredAgents');
      expect(healthStatus).toHaveProperty('uptime');
    });
  });

  describe('Agent Coordination', () => {
    beforeEach(async () => {
      await redisFramework.initialize();
    });

    it('should create a valid test scenario', () => {
      const scenario = createTestScenario();
      
      expect(scenario).toBeDefined();
      expect(scenario.scenarioId).toBeTruthy();
      expect(scenario.name).toBeTruthy();
      expect(scenario.testConfigs).toHaveLength(2);
      expect(scenario.coordinationStrategy).toBeDefined();
      expect(scenario.failureHandling).toBeDefined();
      expect(scenario.successCriteria).toBeDefined();
    });

    it('should coordinate agent testing successfully', async () => {
      const scenario = createTestScenario();
      
      // Mock the test orchestrator to avoid actual test execution
      jest.spyOn(redisFramework as any, 'executeAgentTest')
        .mockResolvedValue({
          agentId: 'test-agent-1',
          testResult: {
            success: true,
            testName: 'Mock Test',
            mode: 'megaparse',
            importTime: 1500,
            patientsImported: 10,
            patientsExpected: 10,
            dashboardVerified: false,
            errors: [],
            warnings: [],
            logs: ['Mock test executed'],
            timestamp: new Date().toISOString(),
            metadata: {
              format: 'lukner',
              browserUsed: false,
              performanceMetrics: {
                importStartTime: Date.now() - 1500,
                importEndTime: Date.now(),
                importDuration: 1500
              }
            }
          },
          executionTime: 1500,
          resourceUsage: {
            cpuUsagePercent: 25,
            memoryUsageMB: 256,
            diskIOKB: 100,
            networkIOKB: 50,
            peakMemoryMB: 300
          }
        });

      const result = await redisFramework.coordinateAgentTesting(scenario);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.testName).toContain('Coordinated Test');
      expect(result.patientsImported).toBeGreaterThan(0);
    });

    it('should handle test failures gracefully', async () => {
      const scenario = createTestScenario();
      
      // Mock a failing test
      jest.spyOn(redisFramework as any, 'executeAgentTest')
        .mockRejectedValue(new Error('Mock test failure'));

      await expect(redisFramework.coordinateAgentTesting(scenario))
        .rejects.toThrow('Mock test failure');
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(async () => {
      await redisFramework.initialize();
    });

    it('should track test progress', async () => {
      const testId = 'test-123';
      
      const progress = await redisFramework.trackTestProgress(testId);
      
      expect(progress).toBeDefined();
      expect(progress).toHaveProperty('progress', '50');
      expect(progress).toHaveProperty('stage', 'importing');
    });

    it('should handle missing progress data', async () => {
      const mockRedis = (redisFramework as any).redis;
      mockRedis.xrevrange.mockResolvedValue([]);
      
      const testId = 'nonexistent-test';
      
      await expect(redisFramework.trackTestProgress(testId))
        .rejects.toThrow('No progress data found');
    });
  });

  describe('TestOrchestrator Enhancement', () => {
    beforeEach(async () => {
      await redisFramework.initialize();
    });

    it('should enhance TestOrchestrator with Redis capabilities', async () => {
      // Mock TestOrchestrator for testing
      const mockOrchestrator = {
        runImportTest: jest.fn().mockResolvedValue({
          success: true,
          testName: 'Mock Test',
          mode: 'megaparse',
          importTime: 1500,
          patientsImported: 10,
          patientsExpected: 10,
          dashboardVerified: false,
          errors: [],
          warnings: [],
          logs: ['Mock test executed'],
          timestamp: new Date().toISOString(),
          metadata: {
            format: 'lukner',
            browserUsed: false,
            performanceMetrics: {
              importStartTime: Date.now() - 1500,
              importEndTime: Date.now(),
              importDuration: 1500
            }
          }
        })
      };
      
      await redisFramework.enhanceWithRedis(mockOrchestrator as any);
      
      // Check that Redis capabilities were injected
      expect((mockOrchestrator as any).redisFramework).toBeDefined();
      expect((mockOrchestrator as any).sendProgressUpdate).toBeDefined();
      expect((mockOrchestrator as any).coordinateWithAgents).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle Redis connection failures gracefully', async () => {
      const mockRedis = (redisFramework as any).redis;
      mockRedis.connect.mockRejectedValue(new Error('Connection failed'));
      
      await expect(redisFramework.initialize())
        .rejects.toThrow('Redis initialization failed');
    });

    it('should validate scenario configuration', async () => {
      await redisFramework.initialize();
      
      const invalidScenario = {
        scenarioId: '',
        name: '',
        description: '',
        testConfigs: [],
        coordinationStrategy: null,
        failureHandling: null,
        successCriteria: null
      } as any;
      
      await expect(redisFramework.coordinateAgentTesting(invalidScenario))
        .rejects.toThrow();
    });
  });

  describe('Resource Management', () => {
    beforeEach(async () => {
      await redisFramework.initialize();
    });

    it('should cleanup resources on shutdown', async () => {
      const mockRedis = (redisFramework as any).redis;
      
      await redisFramework.shutdown();
      
      expect(mockRedis.srem).toHaveBeenCalledWith('active-agents', expect.any(String));
      expect(mockRedis.del).toHaveBeenCalled();
      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should handle shutdown errors gracefully', async () => {
      const mockRedis = (redisFramework as any).redis;
      mockRedis.quit.mockRejectedValue(new Error('Shutdown error'));
      
      // Should not throw even if Redis operations fail
      await expect(redisFramework.shutdown()).resolves.not.toThrow();
    });
  });
});

/**
 * Helper function to create a test scenario for testing
 */
function createTestScenario(): TestScenario {
  const testConfigs: RedisTestConfig[] = [
    {
      agentId: 'test-agent-1',
      redisStreamKey: 'test-stream-1',
      coordinationGroup: 'test-group',
      mode: 'megaparse' as ImportMode,
      format: 'lukner',
      expectedPatients: 10,
      timeout: 30000,
      outputDir: './test-output',
      verifyDashboard: false,
      enableRealTimeProgress: true,
      progressUpdateInterval: 1000
    },
    {
      agentId: 'test-agent-2',
      redisStreamKey: 'test-stream-2',
      coordinationGroup: 'test-group',
      mode: 'secure' as ImportMode,
      format: 'lukner',
      expectedPatients: 15,
      timeout: 30000,
      outputDir: './test-output',
      verifyDashboard: false,
      enableRealTimeProgress: true,
      progressUpdateInterval: 1000
    }
  ];

  return {
    scenarioId: 'test-scenario-123',
    name: 'Test Multi-Agent Coordination',
    description: 'Testing Redis coordination with multiple agents',
    testConfigs,
    coordinationStrategy: {
      type: 'parallel',
      maxConcurrentAgents: 2,
      timeoutMs: 30000,
      retryStrategy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        retryableErrorCodes: ['TIMEOUT', 'CONNECTION_ERROR']
      }
    },
    failureHandling: {
      continueOnAgentFailure: true,
      maxFailurePercentage: 50,
      fallbackStrategy: 'redistribute',
      isolateFailedAgents: true
    },
    successCriteria: {
      minimumSuccessfulTests: 1,
      maximumFailurePercentage: 50,
      performanceThresholds: {
        maxAverageResponseTime: 5000,
        minThroughput: 1,
        maxErrorRate: 0.1
      }
    }
  };
}