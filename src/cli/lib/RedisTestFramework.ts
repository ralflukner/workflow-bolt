/**
 * Redis Test Framework - Multi-Agent Coordination for CLI Testing
 * Integrates Redis Streams with existing oclif CLI testing infrastructure
 */

import { Redis } from 'ioredis';
import { TestOrchestrator } from './TestOrchestrator';
import { 
  TestConfig, 
  TestResult, 
  ImportMode, 
  TestLogger,
  LogEntry,
  PerformanceMetrics
} from '../../types/cli';

// ============================================================================
// Redis Streams Integration Types
// ============================================================================

export interface RedisTestConfig extends TestConfig {
  agentId: string;
  redisStreamKey: string;
  coordinationGroup: string;
  subAgentCount?: number;
  enableRealTimeProgress?: boolean;
  progressUpdateInterval?: number;
  redisConfig?: RedisConnectionConfig;
}

export interface RedisConnectionConfig {
  host: string;
  port: number;
  password?: string;
  keyPrefix?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  lazyConnect?: boolean;
}

export interface SubAgentConfig {
  agentId: string;
  capabilities: TestCapability[];
  resourceLimits: ResourceLimits;
  endpoint?: string;
  priority: number;
}

export interface TestCapability {
  type: 'megaparse' | 'secure' | 'legacy' | 'dashboard' | 'integration' | 'performance';
  supported: boolean;
  configuration?: Record<string, any>;
}

export interface ResourceLimits {
  maxConcurrentTests: number;
  maxMemoryMB: number;
  timeoutMs: number;
  cpuThreshold: number;
}

export interface AgentTestAssignment {
  assignmentId: string;
  agentId: string;
  testConfig: TestConfig;
  priority: number;
  estimatedDuration: number;
  assignedAt: string;
  expectedCompletionAt: string;
}

export interface TestCoordinationMessage {
  messageId: string;
  type: 'test_start' | 'test_progress' | 'test_complete' | 'test_error' | 'agent_status' | 'coordination_request';
  sourceAgentId: string;
  targetAgentId?: string;
  coordinationGroup: string;
  timestamp: string;
  payload: any;
  retryCount?: number;
}

export interface ProgressUpdate {
  testId: string;
  agentId: string;
  stage: string;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining: number;
  metrics?: Partial<PerformanceMetrics>;
  errors?: string[];
  timestamp: string;
}

export interface SubAgentResult {
  agentId: string;
  testResult: TestResult;
  executionTime: number;
  resourceUsage: ResourceUsage;
  errorDetails?: AgentError[];
}

export interface ResourceUsage {
  cpuUsagePercent: number;
  memoryUsageMB: number;
  diskIOKB: number;
  networkIOKB: number;
  peakMemoryMB: number;
}

export interface AgentError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context?: Record<string, any>;
  recoverable: boolean;
}

export interface TestScenario {
  scenarioId: string;
  name: string;
  description: string;
  testConfigs: RedisTestConfig[];
  coordinationStrategy: CoordinationStrategy;
  failureHandling: FailureHandlingStrategy;
  successCriteria: SuccessCriteria;
}

export interface CoordinationStrategy {
  type: 'parallel' | 'sequential' | 'load_balanced' | 'priority_based';
  maxConcurrentAgents: number;
  loadBalancingAlgorithm?: 'round_robin' | 'least_loaded' | 'capability_based';
  timeoutMs: number;
  retryStrategy: RetryStrategy;
}

export interface RetryStrategy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrorCodes: string[];
}

export interface FailureHandlingStrategy {
  continueOnAgentFailure: boolean;
  maxFailurePercentage: number;
  fallbackStrategy: 'redistribute' | 'scale_down' | 'abort';
  isolateFailedAgents: boolean;
}

export interface SuccessCriteria {
  minimumSuccessfulTests: number;
  maximumFailurePercentage: number;
  performanceThresholds: {
    maxAverageResponseTime: number;
    minThroughput: number;
    maxErrorRate: number;
  };
}

// ============================================================================
// Redis Test Framework Implementation
// ============================================================================

export class RedisTestFramework {
  private redis: Redis;
  private logger: TestLogger;
  private orchestrator: TestOrchestrator;
  private agentId: string;
  private isConnected: boolean = false;
  private messageHandlers: Map<string, Function> = new Map();
  private activeTests: Map<string, ProgressUpdate> = new Map();
  private subAgents: Map<string, SubAgentConfig> = new Map();
  private coordinationGroups: Map<string, Set<string>> = new Map();

  constructor(config?: RedisConnectionConfig, agentId?: string) {
    this.agentId = agentId || `cli-agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.logger = new RedisLogger(this.agentId);
    this.orchestrator = new TestOrchestrator();
    
    // Initialize Redis connection with fallback to environment or defaults
    const redisConfig = config || this.getDefaultRedisConfig();
    this.redis = new Redis({
      ...redisConfig,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      keyPrefix: redisConfig.keyPrefix || 'workflow-bolt:testing:'
    });

    this.setupRedisEventHandlers();
    this.setupMessageHandlers();
  }

  // ============================================================================
  // Core Redis Integration Methods
  // ============================================================================

  /**
   * Initialize Redis connection and register agent
   */
  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      this.isConnected = true;
      this.logger.info('Redis connection established', { agentId: this.agentId });

      // Register this agent in the cluster
      await this.registerAgent();
      
      // Start listening for coordination messages
      await this.startMessageConsumer();

      this.logger.info('Redis Test Framework initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis Test Framework', { error });
      throw new Error(`Redis initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Coordinate agent testing scenario
   */
  async coordinateAgentTesting(scenario: TestScenario): Promise<TestResult> {
    this.logger.info('Starting agent testing coordination', { scenarioId: scenario.scenarioId });

    try {
      // Validate scenario
      this.validateTestScenario(scenario);

      // Create coordination group
      const coordinationGroupId = await this.createCoordinationGroup(scenario);

      // Deploy and coordinate sub-agents
      const subAgentResults = await this.deployTestingSubAgents(scenario, coordinationGroupId);

      // Aggregate results
      const aggregatedResult = await this.aggregateSubAgentResults(subAgentResults, scenario);

      // Clean up coordination resources
      await this.cleanupCoordinationGroup(coordinationGroupId);

      this.logger.info('Agent testing coordination completed successfully', { 
        scenarioId: scenario.scenarioId,
        totalAgents: subAgentResults.length,
        successfulAgents: subAgentResults.filter(r => r.testResult.success).length
      });

      return aggregatedResult;

    } catch (error) {
      this.logger.error('Agent testing coordination failed', { 
        scenarioId: scenario.scenarioId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Deploy testing sub-agents
   */
  async deployTestingSubAgents(
    scenario: TestScenario, 
    coordinationGroupId: string
  ): Promise<SubAgentResult[]> {
    this.logger.info('Deploying testing sub-agents', { 
      scenarioId: scenario.scenarioId,
      agentCount: scenario.testConfigs.length 
    });

    const results: SubAgentResult[] = [];
    const assignments: AgentTestAssignment[] = [];

    try {
      // Create test assignments
      for (let i = 0; i < scenario.testConfigs.length; i++) {
        const testConfig = scenario.testConfigs[i];
        const assignment: AgentTestAssignment = {
          assignmentId: `assignment-${Date.now()}-${i}`,
          agentId: testConfig.agentId,
          testConfig,
          priority: i + 1,
          estimatedDuration: this.estimateTestDuration(testConfig),
          assignedAt: new Date().toISOString(),
          expectedCompletionAt: new Date(Date.now() + this.estimateTestDuration(testConfig)).toISOString()
        };
        assignments.push(assignment);
      }

      // Execute based on coordination strategy
      switch (scenario.coordinationStrategy.type) {
        case 'parallel':
          results.push(...await this.executeParallelTests(assignments, coordinationGroupId));
          break;
        case 'sequential':
          results.push(...await this.executeSequentialTests(assignments, coordinationGroupId));
          break;
        case 'load_balanced':
          results.push(...await this.executeLoadBalancedTests(assignments, coordinationGroupId));
          break;
        case 'priority_based':
          results.push(...await this.executePriorityBasedTests(assignments, coordinationGroupId));
          break;
        default:
          throw new Error(`Unknown coordination strategy: ${scenario.coordinationStrategy.type}`);
      }

      return results;

    } catch (error) {
      this.logger.error('Sub-agent deployment failed', { 
        scenarioId: scenario.scenarioId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Track test progress in real-time
   */
  async trackTestProgress(testId: string): Promise<ProgressUpdate> {
    try {
      // Get latest progress from Redis stream
      const progressKey = `progress:${testId}`;
      const progressData = await this.redis.xrevrange(progressKey, '+', '-', 'COUNT', 1);

      if (progressData.length === 0) {
        throw new Error(`No progress data found for test: ${testId}`);
      }

      const [streamId, fields] = progressData[0];
      const progressUpdate: ProgressUpdate = this.parseRedisStreamFields(fields);

      // Update local cache
      this.activeTests.set(testId, progressUpdate);

      return progressUpdate;

    } catch (error) {
      this.logger.error('Failed to track test progress', { testId, error });
      throw error;
    }
  }

  /**
   * Enhance existing TestOrchestrator with Redis capabilities
   */
  async enhanceWithRedis(orchestrator: TestOrchestrator): Promise<void> {
    this.logger.info('Enhancing TestOrchestrator with Redis capabilities');

    try {
      // Ensure Redis is connected
      if (!this.isConnected) {
        await this.initialize();
      }

      // Add Redis-enhanced methods to orchestrator
      this.injectRedisCapabilities(orchestrator);

      this.logger.info('TestOrchestrator enhanced with Redis capabilities successfully');

    } catch (error) {
      this.logger.error('Failed to enhance TestOrchestrator with Redis', { error });
      throw error;
    }
  }

  // ============================================================================
  // Private Implementation Methods
  // ============================================================================

  /**
   * Get default Redis configuration from environment or defaults
   */
  private getDefaultRedisConfig(): RedisConnectionConfig {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'workflow-bolt:testing:',
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };
  }

  /**
   * Setup Redis event handlers
   */
  private setupRedisEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info('Redis connection established');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', { error });
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      this.logger.info('Redis reconnecting...');
    });
  }

  /**
   * Setup message handlers for different coordination messages
   */
  private setupMessageHandlers(): void {
    this.messageHandlers.set('test_start', this.handleTestStartMessage.bind(this));
    this.messageHandlers.set('test_progress', this.handleTestProgressMessage.bind(this));
    this.messageHandlers.set('test_complete', this.handleTestCompleteMessage.bind(this));
    this.messageHandlers.set('test_error', this.handleTestErrorMessage.bind(this));
    this.messageHandlers.set('agent_status', this.handleAgentStatusMessage.bind(this));
    this.messageHandlers.set('coordination_request', this.handleCoordinationRequestMessage.bind(this));
  }

  /**
   * Register this agent in the Redis cluster
   */
  private async registerAgent(): Promise<void> {
    const agentInfo = {
      agentId: this.agentId,
      type: 'cli-test-framework',
      capabilities: ['import', 'verify', 'test-runner', 'health-check'],
      version: '1.0.0',
      registeredAt: new Date().toISOString(),
      status: 'active',
      resourceLimits: {
        maxConcurrentTests: 5,
        maxMemoryMB: 2048,
        timeoutMs: 300000,
        cpuThreshold: 80
      }
    };

    await this.redis.hset(`agents:${this.agentId}`, agentInfo);
    await this.redis.sadd('active-agents', this.agentId);
    await this.redis.expire(`agents:${this.agentId}`, 3600); // 1 hour TTL
  }

  /**
   * Start consuming coordination messages
   */
  private async startMessageConsumer(): Promise<void> {
    const streamKey = `coordination:${this.agentId}`;
    
    // Create consumer group if it doesn't exist
    try {
      await this.redis.xgroup('CREATE', streamKey, 'test-coordination', '$', 'MKSTREAM');
    } catch (error) {
      // Group might already exist
      this.logger.debug('Consumer group might already exist', { error });
    }

    // Start consuming messages
    this.consumeMessages(streamKey);
  }

  /**
   * Continuously consume messages from Redis streams
   */
  private async consumeMessages(streamKey: string): Promise<void> {
    while (this.isConnected) {
      try {
        const results = await this.redis.xreadgroup(
          'GROUP', 'test-coordination', this.agentId,
          'COUNT', 10,
          'BLOCK', 1000,
          'STREAMS', streamKey, '>'
        );

        if (results && results.length > 0) {
          for (const [stream, messages] of results as [string, [string, string[]][]][]) {
            for (const [messageId, fields] of messages) {
              await this.processMessage(messageId, fields);
              // Acknowledge message
              await this.redis.xack(streamKey, 'test-coordination', messageId);
            }
          }
        }
      } catch (error) {
        if (this.isConnected) {
          this.logger.error('Error consuming messages', { error });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
        }
      }
    }
  }

  /**
   * Process a coordination message
   */
  private async processMessage(messageId: string, fields: string[]): Promise<void> {
    try {
      const message: TestCoordinationMessage = this.parseRedisStreamFields(fields);
      const handler = this.messageHandlers.get(message.type);

      if (handler) {
        await handler(message);
      } else {
        this.logger.warn('No handler for message type', { type: message.type, messageId });
      }
    } catch (error) {
      this.logger.error('Error processing message', { messageId, error });
    }
  }

  /**
   * Parse Redis stream fields into an object
   */
  private parseRedisStreamFields(fields: string[]): any {
    const obj: any = {};
    for (let i = 0; i < fields.length; i += 2) {
      const key = fields[i];
      const value = fields[i + 1];
      
      try {
        // Try to parse as JSON, fallback to string
        obj[key] = JSON.parse(value);
      } catch {
        obj[key] = value;
      }
    }
    return obj;
  }

  /**
   * Validate test scenario configuration
   */
  private validateTestScenario(scenario: TestScenario): void {
    if (!scenario.scenarioId || !scenario.name) {
      throw new Error('Scenario must have id and name');
    }

    if (!scenario.testConfigs || scenario.testConfigs.length === 0) {
      throw new Error('Scenario must have at least one test configuration');
    }

    if (!scenario.coordinationStrategy) {
      throw new Error('Scenario must specify coordination strategy');
    }

    // Validate each test config
    scenario.testConfigs.forEach((config, index) => {
      if (!config.agentId) {
        throw new Error(`Test config ${index} must specify agentId`);
      }
      if (!config.mode) {
        throw new Error(`Test config ${index} must specify import mode`);
      }
    });
  }

  /**
   * Create a coordination group for the scenario
   */
  private async createCoordinationGroup(scenario: TestScenario): Promise<string> {
    const groupId = `group-${scenario.scenarioId}-${Date.now()}`;
    const agentIds = scenario.testConfigs.map(config => config.agentId);

    // Store group information
    await this.redis.hset(`coordination-groups:${groupId}`, {
      scenarioId: scenario.scenarioId,
      agentIds: JSON.stringify(agentIds),
      strategy: scenario.coordinationStrategy.type,
      createdAt: new Date().toISOString(),
      status: 'active'
    });

    // Add agents to group
    for (const agentId of agentIds) {
      await this.redis.sadd(`group-members:${groupId}`, agentId);
    }

    this.coordinationGroups.set(groupId, new Set(agentIds));
    
    return groupId;
  }

  /**
   * Estimate test duration based on configuration
   */
  private estimateTestDuration(config: TestConfig): number {
    let baseDuration = 30000; // 30 seconds base

    // Adjust based on mode complexity
    switch (config.mode) {
      case 'megaparse':
        baseDuration *= 1.5;
        break;
      case 'secure':
        baseDuration *= 2.0;
        break;
      case 'legacy':
        baseDuration *= 1.0;
        break;
    }

    // Adjust based on expected patients
    if (config.expectedPatients > 100) {
      baseDuration *= 1.5;
    }

    // Adjust for dashboard verification
    if (config.verifyDashboard) {
      baseDuration *= 1.3;
    }

    return Math.round(baseDuration);
  }

  /**
   * Execute tests in parallel
   */
  private async executeParallelTests(
    assignments: AgentTestAssignment[], 
    coordinationGroupId: string
  ): Promise<SubAgentResult[]> {
    this.logger.info('Executing parallel tests', { count: assignments.length });

    const promises = assignments.map(assignment => 
      this.executeAgentTest(assignment, coordinationGroupId)
    );

    return Promise.all(promises);
  }

  /**
   * Execute tests sequentially
   */
  private async executeSequentialTests(
    assignments: AgentTestAssignment[], 
    coordinationGroupId: string
  ): Promise<SubAgentResult[]> {
    this.logger.info('Executing sequential tests', { count: assignments.length });

    const results: SubAgentResult[] = [];
    
    for (const assignment of assignments) {
      const result = await this.executeAgentTest(assignment, coordinationGroupId);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute tests with load balancing
   */
  private async executeLoadBalancedTests(
    assignments: AgentTestAssignment[], 
    coordinationGroupId: string
  ): Promise<SubAgentResult[]> {
    this.logger.info('Executing load-balanced tests', { count: assignments.length });

    // For now, implement as parallel execution
    // In a full implementation, this would consider agent load and capabilities
    return this.executeParallelTests(assignments, coordinationGroupId);
  }

  /**
   * Execute tests based on priority
   */
  private async executePriorityBasedTests(
    assignments: AgentTestAssignment[], 
    coordinationGroupId: string
  ): Promise<SubAgentResult[]> {
    this.logger.info('Executing priority-based tests', { count: assignments.length });

    // Sort by priority
    const sortedAssignments = [...assignments].sort((a, b) => a.priority - b.priority);
    
    return this.executeSequentialTests(sortedAssignments, coordinationGroupId);
  }

  /**
   * Execute a single agent test
   */
  private async executeAgentTest(
    assignment: AgentTestAssignment, 
    coordinationGroupId: string
  ): Promise<SubAgentResult> {
    const startTime = Date.now();
    this.logger.info('Executing agent test', { 
      assignmentId: assignment.assignmentId, 
      agentId: assignment.agentId 
    });

    try {
      // Send test start message
      await this.sendCoordinationMessage({
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'test_start',
        sourceAgentId: this.agentId,
        targetAgentId: assignment.agentId,
        coordinationGroup: coordinationGroupId,
        timestamp: new Date().toISOString(),
        payload: {
          assignment,
          testConfig: assignment.testConfig
        }
      });

      // Execute test using enhanced orchestrator
      const testResult = await this.orchestrator.runImportTest(assignment.testConfig);

      // Calculate resource usage (simplified)
      const executionTime = Date.now() - startTime;
      const resourceUsage: ResourceUsage = {
        cpuUsagePercent: Math.random() * 50 + 25, // Simulated
        memoryUsageMB: Math.random() * 512 + 256, // Simulated
        diskIOKB: Math.random() * 1024, // Simulated
        networkIOKB: Math.random() * 512, // Simulated
        peakMemoryMB: Math.random() * 768 + 512 // Simulated
      };

      const result: SubAgentResult = {
        agentId: assignment.agentId,
        testResult,
        executionTime,
        resourceUsage
      };

      // Send completion message
      await this.sendCoordinationMessage({
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'test_complete',
        sourceAgentId: this.agentId,
        coordinationGroup: coordinationGroupId,
        timestamp: new Date().toISOString(),
        payload: {
          assignment,
          result
        }
      });

      return result;

    } catch (error) {
      this.logger.error('Agent test execution failed', { 
        assignmentId: assignment.assignmentId, 
        error 
      });

      // Send error message
      await this.sendCoordinationMessage({
        messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'test_error',
        sourceAgentId: this.agentId,
        coordinationGroup: coordinationGroupId,
        timestamp: new Date().toISOString(),
        payload: {
          assignment,
          error: error instanceof Error ? error.message : String(error)
        }
      });

      throw error;
    }
  }

  /**
   * Send coordination message via Redis streams
   */
  private async sendCoordinationMessage(message: TestCoordinationMessage): Promise<void> {
    const streamKey = message.targetAgentId 
      ? `coordination:${message.targetAgentId}`
      : `coordination:group:${message.coordinationGroup}`;

    const fields: string[] = [];
    for (const [key, value] of Object.entries(message)) {
      fields.push(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }

    await this.redis.xadd(streamKey, '*', ...fields);
  }

  /**
   * Aggregate sub-agent results into a single test result
   */
  private async aggregateSubAgentResults(
    subAgentResults: SubAgentResult[], 
    scenario: TestScenario
  ): Promise<TestResult> {
    const successfulResults = subAgentResults.filter(r => r.testResult.success);
    const totalTests = subAgentResults.length;
    const successfulTests = successfulResults.length;
    
    const totalPatientsImported = subAgentResults.reduce(
      (sum, r) => sum + r.testResult.patientsImported, 0
    );
    
    const totalImportTime = subAgentResults.reduce(
      (sum, r) => sum + r.testResult.importTime, 0
    );

    const allErrors = subAgentResults.flatMap(r => r.testResult.errors);
    const allWarnings = subAgentResults.flatMap(r => r.testResult.warnings);
    
    const aggregatedResult: TestResult = {
      success: successfulTests >= scenario.successCriteria.minimumSuccessfulTests,
      testName: `Coordinated Test - ${scenario.name}`,
      mode: 'megaparse', // Default mode
      importTime: Math.round(totalImportTime / totalTests),
      patientsImported: totalPatientsImported,
      patientsExpected: subAgentResults.reduce((sum, r) => sum + r.testResult.patientsExpected, 0),
      dashboardVerified: subAgentResults.some(r => r.testResult.dashboardVerified),
      errors: allErrors,
      warnings: allWarnings,
      logs: [`Coordinated test with ${totalTests} agents, ${successfulTests} successful`],
      timestamp: new Date().toISOString(),
      metadata: {
        format: 'auto',
        browserUsed: subAgentResults.some(r => r.testResult.metadata.browserUsed),
        performanceMetrics: {
          importStartTime: Math.min(...subAgentResults.map(r => r.testResult.metadata.performanceMetrics.importStartTime)),
          importEndTime: Math.max(...subAgentResults.map(r => r.testResult.metadata.performanceMetrics.importEndTime)),
          importDuration: totalImportTime
        }
      }
    };

    return aggregatedResult;
  }

  /**
   * Clean up coordination group resources
   */
  private async cleanupCoordinationGroup(groupId: string): Promise<void> {
    try {
      await this.redis.del(`coordination-groups:${groupId}`);
      await this.redis.del(`group-members:${groupId}`);
      this.coordinationGroups.delete(groupId);
      
      this.logger.info('Coordination group cleaned up', { groupId });
    } catch (error) {
      this.logger.warn('Failed to cleanup coordination group', { groupId, error });
    }
  }

  /**
   * Inject Redis capabilities into TestOrchestrator
   */
  private injectRedisCapabilities(orchestrator: TestOrchestrator): void {
    // Add Redis-enhanced methods to the orchestrator instance
    // This is a simplified approach - in production, you might use composition or inheritance
    
    // Store reference to Redis framework
    (orchestrator as any).redisFramework = this;
    
    // Add method to send progress updates
    (orchestrator as any).sendProgressUpdate = async (testId: string, progress: ProgressUpdate) => {
      await this.sendProgressUpdate(testId, progress);
    };
    
    // Add method to coordinate with other agents
    (orchestrator as any).coordinateWithAgents = async (message: TestCoordinationMessage) => {
      await this.sendCoordinationMessage(message);
    };
  }

  /**
   * Send progress update to Redis stream
   */
  private async sendProgressUpdate(testId: string, progress: ProgressUpdate): Promise<void> {
    const progressKey = `progress:${testId}`;
    const fields: string[] = [];
    
    for (const [key, value] of Object.entries(progress)) {
      fields.push(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }

    await this.redis.xadd(progressKey, '*', ...fields);
    await this.redis.expire(progressKey, 3600); // 1 hour TTL
  }

  // ============================================================================
  // Message Handlers
  // ============================================================================

  private async handleTestStartMessage(message: TestCoordinationMessage): Promise<void> {
    this.logger.info('Received test start message', { messageId: message.messageId });
    // Implementation would handle test start coordination
  }

  private async handleTestProgressMessage(message: TestCoordinationMessage): Promise<void> {
    this.logger.debug('Received test progress message', { messageId: message.messageId });
    // Implementation would handle progress updates
  }

  private async handleTestCompleteMessage(message: TestCoordinationMessage): Promise<void> {
    this.logger.info('Received test complete message', { messageId: message.messageId });
    // Implementation would handle test completion
  }

  private async handleTestErrorMessage(message: TestCoordinationMessage): Promise<void> {
    this.logger.error('Received test error message', { messageId: message.messageId });
    // Implementation would handle test errors
  }

  private async handleAgentStatusMessage(message: TestCoordinationMessage): Promise<void> {
    this.logger.debug('Received agent status message', { messageId: message.messageId });
    // Implementation would handle agent status updates
  }

  private async handleCoordinationRequestMessage(message: TestCoordinationMessage): Promise<void> {
    this.logger.info('Received coordination request message', { messageId: message.messageId });
    // Implementation would handle coordination requests
  }

  // ============================================================================
  // Public Utility Methods
  // ============================================================================

  /**
   * Get health status of Redis connection and framework
   */
  async getHealthStatus(): Promise<{
    redis: boolean;
    framework: boolean;
    activeTests: number;
    registeredAgents: number;
    uptime: number;
  }> {
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const redisLatency = Date.now() - startTime;

      const activeAgents = await this.redis.scard('active-agents');

      return {
        redis: this.isConnected && redisLatency < 1000,
        framework: this.isConnected,
        activeTests: this.activeTests.size,
        registeredAgents: activeAgents,
        uptime: Date.now() - startTime
      };
    } catch (error) {
      return {
        redis: false,
        framework: false,
        activeTests: 0,
        registeredAgents: 0,
        uptime: 0
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Redis Test Framework');

    try {
      // Unregister agent
      await this.redis.srem('active-agents', this.agentId);
      await this.redis.del(`agents:${this.agentId}`);

      // Close Redis connection
      await this.redis.quit();
      this.isConnected = false;

      this.logger.info('Redis Test Framework shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }
  }
}

// ============================================================================
// Redis-Enhanced Logger Implementation
// ============================================================================

class RedisLogger implements TestLogger {
  private logs: LogEntry[] = [];
  private agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  debug(message: string, metadata?: any): void {
    this.addLog('debug', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.addLog('info', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.addLog('warn', message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.addLog('error', message, metadata);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private addLog(level: LogEntry['level'], message: string, metadata?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component: `RedisTestFramework:${this.agentId}`,
      metadata: {
        ...metadata,
        agentId: this.agentId
      }
    };

    this.logs.push(entry);

    // Also log to console for real-time feedback
    const logMessage = `[${level.toUpperCase()}] [${this.agentId}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }
}

// Note: All types and the main class are already exported above with their declarations