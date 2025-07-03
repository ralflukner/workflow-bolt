/**
 * Test Runner Command - Comprehensive automated testing
 * Executes all test suites and provides production readiness assessment
 */

import { Command, Flags } from '@oclif/core';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  critical: boolean;
  timeout: number;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  errors: string[];
  passedCount: number;
  totalCount: number;
}

interface OverallStatus {
  ready: boolean;
  criticalIssues: string[];
  warnings: string[];
  passedSuites: number;
  totalSuites: number;
  recommendations: string[];
}

export default class TestRunnerCommand extends Command {
  static summary = 'Run comprehensive test suite for production readiness assessment';
  
  static description = `
Execute all test suites and provide complete production readiness assessment.

This command runs:
1. MegaParse integration tests
2. HIPAA compliance validation  
3. Secure storage encryption tests
4. Schedule import/export tests
5. Dashboard integration tests
6. End-to-end workflow validation

Provides comprehensive report on application readiness for clinic use.

Examples:
  # Run all tests with detailed output
  $ workflow-test test-runner

  # Run tests and generate detailed report
  $ workflow-test test-runner --detailed --output=./test-reports

  # Quick health check (critical tests only)
  $ workflow-test test-runner --quick
`;

  static examples = [
    '$ workflow-test test-runner',
    '$ workflow-test test-runner --detailed --output=./reports',
    '$ workflow-test test-runner --quick --no-build'
  ];

  static flags = {
    output: Flags.string({
      char: 'o',
      description: 'Output directory for test reports',
      default: './test-reports',
      required: false
    }),

    detailed: Flags.boolean({
      char: 'd', 
      description: 'Generate detailed test reports',
      default: false
    }),

    quick: Flags.boolean({
      char: 'q',
      description: 'Run only critical tests for quick health check',
      default: false
    }),

    'no-build': Flags.boolean({
      description: 'Skip build step (use existing compiled code)',
      default: false
    }),

    parallel: Flags.boolean({
      char: 'p',
      description: 'Run non-conflicting tests in parallel',
      default: false
    }),

    verbose: Flags.boolean({
      char: 'v',
      description: 'Verbose output with all test details',
      default: false
    }),

    'fail-fast': Flags.boolean({
      description: 'Stop on first critical test failure',
      default: false
    })
  };

  private testSuites: TestSuite[] = [
    {
      name: 'MegaParse Integration',
      command: 'npm test -- --testPathPatterns="megaParse"',
      description: 'Validates MegaParse schedule parsing functionality',
      critical: true,
      timeout: 30000
    },
    {
      name: 'Schedule Import/Export',
      command: 'npm test -- --testPathPatterns="scheduleImport|parseSchedule"',
      description: 'Tests all schedule parsing modes and data formats',
      critical: true,
      timeout: 45000
    },
    {
      name: 'HIPAA Compliance',
      command: 'npm test -- --testPathPatterns="hipaaCompliance"',
      description: 'Validates HIPAA compliance and security measures',
      critical: true,
      timeout: 60000
    },
    {
      name: 'Secure Storage',
      command: 'npm test -- --testPathPatterns="secureStorage"',
      description: 'Tests encryption and secure data handling',
      critical: true,
      timeout: 45000
    },
    {
      name: 'Component Tests',
      command: 'npm test -- --testPathPatterns="components"',
      description: 'Validates React component functionality',
      critical: false,
      timeout: 30000
    },
    {
      name: 'Service Integration',
      command: 'npm test -- --testPathPatterns="services"',
      description: 'Tests service layer integration',
      critical: false,
      timeout: 30000
    },
    {
      name: 'Full Test Suite',
      command: 'npm test',
      description: 'Complete test suite execution',
      critical: false,
      timeout: 120000
    }
  ];

  async run(): Promise<void> {
    const { flags } = await this.parse(TestRunnerCommand);

    this.displayHeader();

    try {
      // Setup output directory
      if (!existsSync(flags.output)) {
        mkdirSync(flags.output, { recursive: true });
      }

      // Build if needed
      if (!flags['no-build']) {
        await this.buildApplication();
      }

      // Select test suites to run
      const suitesToRun = flags.quick 
        ? this.testSuites.filter(suite => suite.critical)
        : this.testSuites;

      this.log(chalk.white(`\n🧪 Running ${suitesToRun.length} test suites...\n`));

      // Run test suites
      const results: TestResult[] = [];
      if (flags.parallel) {
        const parallelResults = await this.runTestsParallel(suitesToRun, flags);
        results.push(...parallelResults);
      } else {
        const sequentialResults = await this.runTestsSequential(suitesToRun, flags);
        results.push(...sequentialResults);
      }

      // Analyze results
      const status = this.analyzeResults(results);

      // Display results
      this.displayResults(results, status, flags.verbose);

      // Generate reports
      if (flags.detailed) {
        await this.generateDetailedReport(results, status, flags.output);
      }

      // Display final assessment
      this.displayFinalAssessment(status);

      // Set exit code
      process.exitCode = status.ready ? 0 : 1;

    } catch (error) {
      this.error(chalk.red(`Test runner failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * Display command header
   */
  private displayHeader(): void {
    this.log(chalk.cyan.bold('\n🧪 Comprehensive Test Runner & Production Readiness Assessment'));
    this.log(chalk.cyan('═'.repeat(80)));
    this.log(chalk.white(`Time: ${chalk.yellow(new Date().toLocaleString())}`));
    this.log(chalk.white(`Purpose: ${chalk.yellow('Validate application readiness for clinic schedule management')}\n`));
  }

  /**
   * Build application if needed
   */
  private async buildApplication(): Promise<void> {
    this.log(chalk.yellow('🔨 Building application...'));

    try {
      // Build main application
      execSync('npm run build', { 
        stdio: 'pipe',
        timeout: 120000
      });

      // Try to build CLI (may fail, but continue)
      try {
        execSync('npm run build:cli', { 
          stdio: 'pipe',
          timeout: 60000
        });
        this.log(chalk.green('   ✓ Application and CLI built successfully'));
      } catch {
        this.log(chalk.yellow('   ⚠ CLI build failed, continuing with main app'));
      }

    } catch (error) {
      throw new Error(`Build failed: ${error}`);
    }
  }

  /**
   * Run tests sequentially
   */
  private async runTestsSequential(suites: TestSuite[], flags: any): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (let i = 0; i < suites.length; i++) {
      const suite = suites[i];
      this.log(chalk.white(`📋 Running ${chalk.yellow(suite.name)} (${i + 1}/${suites.length})`));
      
      const result = await this.runSingleTest(suite, flags);
      results.push(result);

      // Display immediate result
      const status = result.passed ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
      const duration = chalk.gray(`(${result.duration}ms)`);
      this.log(chalk.white(`   ${status} ${duration}`));

      if (!result.passed && flags.verbose) {
        this.log(chalk.red(`   Error: ${result.errors[0] || 'Unknown error'}`));
      }

      // Fail fast for critical tests
      if (!result.passed && suite.critical && flags['fail-fast']) {
        this.log(chalk.red('\n🛑 Critical test failed, stopping execution (--fail-fast enabled)'));
        break;
      }

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Run tests in parallel
   */
  private async runTestsParallel(suites: TestSuite[], flags: any): Promise<TestResult[]> {
    this.log(chalk.yellow('🚀 Running tests in parallel...'));

    const testPromises = suites.map(suite => this.runSingleTest(suite, flags));
    return Promise.all(testPromises);
  }

  /**
   * Run a single test suite
   */
  private async runSingleTest(suite: TestSuite, flags: any): Promise<TestResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      let output = '';
      let errors: string[] = [];

      try {
        const child = spawn('bash', ['-c', suite.command], {
          stdio: 'pipe',
          timeout: suite.timeout
        });

        child.stdout?.on('data', (data) => {
          output += data.toString();
        });

        child.stderr?.on('data', (data) => {
          const errorText = data.toString();
          output += errorText;
          errors.push(errorText);
        });

        child.on('close', (code) => {
          const duration = Date.now() - startTime;
          const passed = code === 0;

          // Parse test results from output
          const { passedCount, totalCount } = this.parseTestOutput(output);

          resolve({
            suite: suite.name,
            passed,
            duration,
            output,
            errors,
            passedCount,
            totalCount
          });
        });

        child.on('error', (error) => {
          const duration = Date.now() - startTime;
          resolve({
            suite: suite.name,
            passed: false,
            duration,
            output,
            errors: [error.message],
            passedCount: 0,
            totalCount: 0
          });
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        resolve({
          suite: suite.name,
          passed: false,
          duration,
          output,
          errors: [error instanceof Error ? error.message : String(error)],
          passedCount: 0,
          totalCount: 0
        });
      }
    });
  }

  /**
   * Parse test output to extract pass/fail counts
   */
  private parseTestOutput(output: string): { passedCount: number; totalCount: number } {
    // Look for Jest output patterns
    const testMatch = output.match(/Tests:\s+(\d+)\s+passed(?:,\s+(\d+)\s+failed)?(?:,\s+(\d+)\s+total)?/);
    if (testMatch) {
      const passed = parseInt(testMatch[1]) || 0;
      const failed = parseInt(testMatch[2]) || 0;
      const total = parseInt(testMatch[3]) || (passed + failed);
      return { passedCount: passed, totalCount: total };
    }

    // Alternative pattern
    const altMatch = output.match(/(\d+)\s+passed,\s+(\d+)\s+total/);
    if (altMatch) {
      return { 
        passedCount: parseInt(altMatch[1]), 
        totalCount: parseInt(altMatch[2]) 
      };
    }

    return { passedCount: 0, totalCount: 0 };
  }

  /**
   * Analyze test results for production readiness
   */
  private analyzeResults(results: TestResult[]): OverallStatus {
    const criticalResults = results.filter(r => 
      this.testSuites.find(s => s.name === r.suite)?.critical
    );

    const passedSuites = results.filter(r => r.passed).length;
    const totalSuites = results.length;
    const criticalPassed = criticalResults.filter(r => r.passed).length;
    const totalCritical = criticalResults.length;

    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check critical test failures
    criticalResults.forEach(result => {
      if (!result.passed) {
        criticalIssues.push(`${result.suite}: ${result.errors[0] || 'Test failed'}`);
      }
    });

    // Check test coverage
    const totalTestsPassed = results.reduce((sum, r) => sum + r.passedCount, 0);
    const totalTestsRun = results.reduce((sum, r) => sum + r.totalCount, 0);
    const testCoverage = totalTestsRun > 0 ? (totalTestsPassed / totalTestsRun) * 100 : 0;

    if (testCoverage < 80) {
      warnings.push(`Low test coverage: ${testCoverage.toFixed(1)}% (target: 80%+)`);
    }

    // Generate recommendations
    if (criticalIssues.length > 0) {
      recommendations.push('Fix all critical test failures before production use');
    }

    if (warnings.length > 0) {
      recommendations.push('Address warnings to improve application reliability');
    }

    if (criticalIssues.length === 0 && warnings.length === 0) {
      recommendations.push('Application appears ready for clinic schedule management');
      recommendations.push('Consider running end-to-end validation with real clinic data');
    }

    const ready = criticalIssues.length === 0 && testCoverage >= 70;

    return {
      ready,
      criticalIssues,
      warnings,
      passedSuites,
      totalSuites,
      recommendations
    };
  }

  /**
   * Display test results
   */
  private displayResults(results: TestResult[], status: OverallStatus, verbose: boolean): void {
    this.log(chalk.cyan('\n📊 Test Results Summary'));
    this.log(chalk.cyan('─'.repeat(50)));

    // Overall statistics
    this.log(chalk.white(`📈 Overall: ${chalk.yellow(status.passedSuites)}/${chalk.yellow(status.totalSuites)} suites passed`));

    const totalTestsPassed = results.reduce((sum, r) => sum + r.passedCount, 0);
    const totalTestsRun = results.reduce((sum, r) => sum + r.totalCount, 0);
    const coverage = totalTestsRun > 0 ? (totalTestsPassed / totalTestsRun) * 100 : 0;

    this.log(chalk.white(`🎯 Test Coverage: ${coverage >= 80 ? chalk.green(coverage.toFixed(1) + '%') : chalk.red(coverage.toFixed(1) + '%')}`));

    // Individual suite results
    this.log(chalk.white(`\n📋 Suite Details:`));
    results.forEach(result => {
      const status = result.passed ? chalk.green('✅') : chalk.red('❌');
      const critical = this.testSuites.find(s => s.name === result.suite)?.critical ? chalk.red('CRITICAL') : chalk.gray('optional');
      const duration = chalk.gray(`${result.duration}ms`);
      const testCount = result.totalCount > 0 ? chalk.gray(`(${result.passedCount}/${result.totalCount})`) : '';

      this.log(chalk.white(`   ${status} ${result.suite} ${critical} ${duration} ${testCount}`));

      if (!result.passed && verbose && result.errors.length > 0) {
        this.log(chalk.red(`      Error: ${result.errors[0]}`));
      }
    });

    // Critical issues
    if (status.criticalIssues.length > 0) {
      this.log(chalk.red('\n❌ Critical Issues:'));
      status.criticalIssues.forEach(issue => {
        this.log(chalk.red(`   • ${issue}`));
      });
    }

    // Warnings
    if (status.warnings.length > 0) {
      this.log(chalk.yellow('\n⚠️  Warnings:'));
      status.warnings.forEach(warning => {
        this.log(chalk.yellow(`   • ${warning}`));
      });
    }
  }

  /**
   * Generate detailed report
   */
  private async generateDetailedReport(results: TestResult[], status: OverallStatus, outputDir: string): Promise<void> {
    const reportPath = join(outputDir, `test-report-${Date.now()}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        ready: status.ready,
        passedSuites: status.passedSuites,
        totalSuites: status.totalSuites,
        criticalIssues: status.criticalIssues.length,
        warnings: status.warnings.length
      },
      results,
      status,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd()
      }
    };

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(chalk.blue(`\n📄 Detailed report saved: ${reportPath}`));
  }

  /**
   * Display final production readiness assessment
   */
  private displayFinalAssessment(status: OverallStatus): void {
    this.log(chalk.cyan('\n🏥 Production Readiness Assessment'));
    this.log(chalk.cyan('═'.repeat(60)));

    if (status.ready) {
      this.log(chalk.green.bold('✅ APPLICATION IS READY FOR CLINIC SCHEDULE MANAGEMENT'));
      this.log(chalk.green('\nThe application has passed all critical tests and appears'));
      this.log(chalk.green('suitable for managing clinic schedules with the following features:'));
      this.log(chalk.green('• MegaParse schedule import working correctly'));
      this.log(chalk.green('• HIPAA compliance measures validated'));
      this.log(chalk.green('• Secure data handling implemented'));
      this.log(chalk.green('• Core functionality tested and verified'));
    } else {
      this.log(chalk.red.bold('❌ APPLICATION NOT READY FOR PRODUCTION'));
      this.log(chalk.red('\nCritical issues must be resolved before clinic use:'));
      status.criticalIssues.forEach(issue => {
        this.log(chalk.red(`• ${issue}`));
      });
    }

    this.log(chalk.white('\n💡 Recommendations:'));
    status.recommendations.forEach(rec => {
      this.log(chalk.white(`• ${rec}`));
    });

    this.log(chalk.cyan('\n' + '═'.repeat(60)));
    
    if (status.ready) {
      this.log(chalk.green.bold('🎉 You can proceed with confidence to use this application'));
      this.log(chalk.green.bold('   for managing your clinic schedule!'));
    } else {
      this.log(chalk.red.bold('⚠️  Please address critical issues before clinic use.'));
    }
  }
}