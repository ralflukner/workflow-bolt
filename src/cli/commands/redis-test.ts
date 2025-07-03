/**
 * Redis Test Command - Demonstrate multi-agent coordination testing
 */

import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { RedisTestFramework, TestScenario, RedisTestConfig } from '../lib/RedisTestFramework.js';
import { ImportMode } from '../../types/cli.js';

export default class RedisTestCommand extends Command {
  static summary = 'Test Redis Streams integration for multi-agent coordination';
  
  static description = `
Demonstrate Redis Streams integration with CLI testing infrastructure.

This command showcases multi-agent coordination capabilities using Redis Streams:
1. Agent registration and discovery
2. Test scenario orchestration
3. Real-time progress tracking
4. Sub-agent coordination
5. Result aggregation

Examples:
  # Basic Redis connectivity test
  $ workflow-test redis-test

  # Multi-agent coordination test
  $ workflow-test redis-test --agents 3 --scenario parallel

  # Performance benchmarking with Redis
  $ workflow-test redis-test --benchmark --duration 60

  # Health check for Redis infrastructure
  $ workflow-test redis-test --health-check
`;

  static examples = [
    '$ workflow-test redis-test',
    '$ workflow-test redis-test --agents 3 --scenario parallel',
    '$ workflow-test redis-test --benchmark --duration 60',
    '$ workflow-test redis-test --health-check --json'
  ];

  static flags = {
    agents: Flags.integer({
      char: 'a',
      description: 'Number of sub-agents to coordinate for testing',
      default: 1,
      min: 1,
      max: 10
    }),

    scenario: Flags.string({
      char: 's',
      description: 'Test coordination scenario',
      options: ['parallel', 'sequential', 'load_balanced', 'priority_based'],
      default: 'parallel'
    }),

    mode: Flags.string({
      char: 'm',
      description: 'Import mode for testing',
      options: ['megaparse', 'secure', 'legacy'],
      default: 'megaparse'
    }),

    'health-check': Flags.boolean({
      description: 'Run Redis infrastructure health check',
      default: false
    }),

    benchmark: Flags.boolean({
      char: 'b',
      description: 'Run performance benchmarking tests',
      default: false
    }),

    duration: Flags.integer({
      char: 'd',
      description: 'Test duration in seconds (for benchmark mode)',
      default: 30,
      min: 10,
      max: 300
    }),

    'redis-host': Flags.string({
      description: 'Redis server host',
      default: 'localhost'
    }),

    'redis-port': Flags.integer({
      description: 'Redis server port',
      default: 6379
    }),

    'coordination-group': Flags.string({
      description: 'Coordination group identifier',
      default: 'cli-test-group'
    }),

    json: Flags.boolean({
      description: 'Output results in JSON format',
      default: false
    }),

    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose logging',
      default: false
    }),

    timeout: Flags.integer({
      char: 't',
      description: 'Test timeout in milliseconds',
      default: 60000
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RedisTestCommand);

    if (!flags.json) {
      this.displayHeader();
    }

    const startTime = Date.now();

    try {
      // Initialize Redis Test Framework
      const redisFramework = new RedisTestFramework({
        host: flags['redis-host'],
        port: flags['redis-port']
      });

      await redisFramework.initialize();

      if (flags['health-check']) {
        await this.runHealthCheck(redisFramework, flags);
      } else if (flags.benchmark) {
        await this.runBenchmarkTest(redisFramework, flags);
      } else {
        await this.runCoordinationTest(redisFramework, flags);
      }

      await redisFramework.shutdown();

      const totalDuration = Date.now() - startTime;
      
      if (!flags.json) {
        this.log(chalk.green(`\n✅ Redis test completed successfully in ${totalDuration}ms`));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (flags.json) {
        this.log(JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }, null, 2));
      } else {
        this.error(chalk.red(`Redis test failed: ${errorMessage}`));
      }
    }
  }

  /**
   * Display command header
   */
  private displayHeader(): void {
    this.log(chalk.cyan.bold('\n🔴 Redis Streams Multi-Agent Testing'));
    this.log(chalk.cyan('═'.repeat(50)));
    this.log(chalk.white(`Time: ${chalk.yellow(new Date().toLocaleString())}\n`));
  }

  /**
   * Run Redis infrastructure health check
   */
  private async runHealthCheck(framework: RedisTestFramework, flags: any): Promise<void> {
    if (!flags.json) {
      this.log(chalk.yellow('🔍 Running Redis infrastructure health check...\n'));
    }

    const healthStatus = await framework.getHealthStatus();

    if (flags.json) {
      this.log(JSON.stringify({
        type: 'health_check',
        timestamp: new Date().toISOString(),
        status: healthStatus
      }, null, 2));
    } else {
      this.displayHealthStatus(healthStatus);
    }
  }

  /**
   * Display health status in human-readable format
   */
  private displayHealthStatus(status: any): void {
    this.log(chalk.cyan('📊 Redis Health Status'));
    this.log(chalk.cyan('─'.repeat(30)));

    const redisIcon = status.redis ? '✅' : '❌';
    const frameworkIcon = status.framework ? '✅' : '❌';

    this.log(chalk.white(`${redisIcon} Redis Connection: ${status.redis ? chalk.green('Connected') : chalk.red('Disconnected')}`));
    this.log(chalk.white(`${frameworkIcon} Framework: ${status.framework ? chalk.green('Ready') : chalk.red('Not Ready')}`));
    this.log(chalk.white(`🧪 Active Tests: ${chalk.yellow(status.activeTests)}`));
    this.log(chalk.white(`🤖 Registered Agents: ${chalk.yellow(status.registeredAgents)}`));
    this.log(chalk.white(`⏱️  Uptime: ${chalk.gray(status.uptime + 'ms')}`));

    if (status.redis && status.framework) {
      this.log(chalk.green.bold('\n✅ Redis infrastructure is healthy and ready for multi-agent coordination!'));
    } else {
      this.log(chalk.red.bold('\n❌ Redis infrastructure has issues that need attention.'));
    }
  }

  /**
   * Run performance benchmark test
   */
  private async runBenchmarkTest(framework: RedisTestFramework, flags: any): Promise<void> {
    if (!flags.json) {
      this.log(chalk.yellow(`🚀 Running ${flags.duration}s performance benchmark...\n`));
    }

    const scenario = this.createBenchmarkScenario(flags);
    const result = await framework.coordinateAgentTesting(scenario);

    if (flags.json) {
      this.log(JSON.stringify({
        type: 'benchmark',
        timestamp: new Date().toISOString(),
        result
      }, null, 2));
    } else {
      this.displayBenchmarkResults(result, flags.duration);
    }
  }

  /**
   * Run multi-agent coordination test
   */
  private async runCoordinationTest(framework: RedisTestFramework, flags: any): Promise<void> {
    if (!flags.json) {
      this.log(chalk.yellow(`🤖 Coordinating ${flags.agents} agents with ${flags.scenario} strategy...\n`));
    }

    const scenario = this.createTestScenario(flags);
    const result = await framework.coordinateAgentTesting(scenario);

    if (flags.json) {
      this.log(JSON.stringify({
        type: 'coordination',
        timestamp: new Date().toISOString(),
        result
      }, null, 2));
    } else {
      this.displayCoordinationResults(result, flags);
    }
  }

  /**
   * Create test scenario configuration
   */
  private createTestScenario(flags: any): TestScenario {
    const testConfigs: RedisTestConfig[] = [];

    for (let i = 0; i < flags.agents; i++) {
      testConfigs.push({
        agentId: `test-agent-${i + 1}`,
        redisStreamKey: `test-stream-${i + 1}`,
        coordinationGroup: flags['coordination-group'],
        mode: flags.mode as ImportMode,
        format: 'lukner',
        expectedPatients: 10 + (i * 5), // Vary expected patients per agent
        timeout: flags.timeout,
        outputDir: './test-output',
        verifyDashboard: false,
        enableRealTimeProgress: true,
        progressUpdateInterval: 1000
      });
    }

    return {
      scenarioId: `scenario-${Date.now()}`,
      name: `Multi-Agent ${flags.scenario} Test`,
      description: `Testing ${flags.agents} agents with ${flags.scenario} coordination strategy`,
      testConfigs,
      coordinationStrategy: {
        type: flags.scenario,
        maxConcurrentAgents: flags.scenario === 'parallel' ? flags.agents : 1,
        timeoutMs: flags.timeout,
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
        minimumSuccessfulTests: Math.ceil(flags.agents * 0.7), // 70% success rate
        maximumFailurePercentage: 30,
        performanceThresholds: {
          maxAverageResponseTime: 5000,
          minThroughput: 1,
          maxErrorRate: 0.1
        }
      }
    };
  }

  /**
   * Create benchmark scenario configuration
   */
  private createBenchmarkScenario(flags: any): TestScenario {
    const agentCount = Math.min(flags.agents, 5); // Limit for benchmark
    const testConfigs: RedisTestConfig[] = [];

    for (let i = 0; i < agentCount; i++) {
      testConfigs.push({
        agentId: `benchmark-agent-${i + 1}`,
        redisStreamKey: `benchmark-stream-${i + 1}`,
        coordinationGroup: `benchmark-${flags['coordination-group']}`,
        mode: 'megaparse' as ImportMode,
        format: 'lukner',
        expectedPatients: 50, // Fixed load for benchmarking
        timeout: flags.duration * 1000,
        outputDir: './benchmark-output',
        verifyDashboard: false,
        enableRealTimeProgress: true,
        progressUpdateInterval: 500
      });
    }

    return {
      scenarioId: `benchmark-${Date.now()}`,
      name: 'Performance Benchmark Test',
      description: `Benchmarking Redis coordination with ${agentCount} agents for ${flags.duration}s`,
      testConfigs,
      coordinationStrategy: {
        type: 'load_balanced',
        maxConcurrentAgents: agentCount,
        timeoutMs: flags.duration * 1000,
        retryStrategy: {
          maxRetries: 1,
          backoffStrategy: 'fixed',
          baseDelayMs: 500,
          maxDelayMs: 500,
          retryableErrorCodes: ['TIMEOUT']
        }
      },
      failureHandling: {
        continueOnAgentFailure: false,
        maxFailurePercentage: 10,
        fallbackStrategy: 'abort',
        isolateFailedAgents: true
      },
      successCriteria: {
        minimumSuccessfulTests: agentCount,
        maximumFailurePercentage: 10,
        performanceThresholds: {
          maxAverageResponseTime: 2000,
          minThroughput: 10,
          maxErrorRate: 0.05
        }
      }
    };
  }

  /**
   * Display coordination test results
   */
  private displayCoordinationResults(result: any, flags: any): void {
    this.log(chalk.cyan('📈 Coordination Test Results'));
    this.log(chalk.cyan('─'.repeat(35)));

    const successIcon = result.success ? '✅' : '❌';
    const successColor = result.success ? chalk.green : chalk.red;

    this.log(chalk.white(`${successIcon} Overall Success: ${successColor(result.success ? 'PASSED' : 'FAILED')}`));
    this.log(chalk.white(`👥 Agents Coordinated: ${chalk.yellow(flags.agents)}`));
    this.log(chalk.white(`📊 Strategy Used: ${chalk.cyan(flags.scenario)}`));
    this.log(chalk.white(`🎯 Mode Tested: ${chalk.blue(flags.mode)}`));
    this.log(chalk.white(`👨‍⚕️ Patients Imported: ${chalk.green(result.patientsImported)}`));
    this.log(chalk.white(`⏱️  Import Time: ${chalk.gray(result.importTime + 'ms')}`));
    this.log(chalk.white(`🖥️  Dashboard Verified: ${result.dashboardVerified ? chalk.green('Yes') : chalk.gray('No')}`));

    if (result.errors && result.errors.length > 0) {
      this.log(chalk.red(`\n❌ Errors (${result.errors.length}):`));
      result.errors.forEach((error: string) => {
        this.log(chalk.red(`   • ${error}`));
      });
    }

    if (result.warnings && result.warnings.length > 0) {
      this.log(chalk.yellow(`\n⚠️  Warnings (${result.warnings.length}):`));
      result.warnings.forEach((warning: string) => {
        this.log(chalk.yellow(`   • ${warning}`));
      });
    }

    this.log(chalk.cyan(`\n🕐 Test completed at: ${chalk.gray(result.timestamp)}`));
  }

  /**
   * Display benchmark test results
   */
  private displayBenchmarkResults(result: any, duration: number): void {
    this.log(chalk.cyan('🚀 Benchmark Test Results'));
    this.log(chalk.cyan('─'.repeat(30)));

    const throughput = result.patientsImported / (duration || 1);
    const avgResponseTime = result.importTime;

    this.log(chalk.white(`📊 Throughput: ${chalk.green(throughput.toFixed(2))} patients/sec`));
    this.log(chalk.white(`⚡ Avg Response Time: ${chalk.yellow(avgResponseTime)}ms`));
    this.log(chalk.white(`👨‍⚕️ Total Patients: ${chalk.blue(result.patientsImported)}`));
    this.log(chalk.white(`⏱️  Test Duration: ${chalk.gray(duration)}s`));
    this.log(chalk.white(`✅ Success Rate: ${result.success ? chalk.green('100%') : chalk.red('<100%')}`));

    // Performance assessment
    this.log(chalk.cyan('\n📈 Performance Assessment'));
    this.log(chalk.cyan('─'.repeat(25)));

    if (throughput > 5) {
      this.log(chalk.green('🚀 Excellent throughput - Redis coordination is highly efficient!'));
    } else if (throughput > 2) {
      this.log(chalk.yellow('⚡ Good throughput - Redis coordination is performing well.'));
    } else {
      this.log(chalk.red('🐌 Low throughput - Redis coordination may need optimization.'));
    }

    if (avgResponseTime < 1000) {
      this.log(chalk.green('⚡ Fast response times - Real-time coordination achieved!'));
    } else if (avgResponseTime < 3000) {
      this.log(chalk.yellow('📈 Acceptable response times - Near real-time coordination.'));
    } else {
      this.log(chalk.red('🐌 Slow response times - Coordination latency needs attention.'));
    }
  }
}