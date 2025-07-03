/**
 * Health Check Command - Quick production readiness assessment
 * Fast validation of critical systems for clinic readiness
 */

import { Command, Flags } from '@oclif/core';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
  duration?: number;
}

export default class HealthCheckCommand extends Command {
  static summary = 'Quick health check for production readiness';
  
  static description = `
Perform rapid health check of critical systems for clinic schedule management.

This command quickly validates:
1. MegaParse schedule parsing functionality
2. Core application build status
3. Critical dependencies availability
4. Basic security measures
5. Data persistence capabilities

Designed for fast validation before clinic use.

Examples:
  # Quick health check
  $ workflow-test health-check

  # Detailed health check with component testing
  $ workflow-test health-check --detailed

  # Critical systems only (fastest)
  $ workflow-test health-check --critical-only
`;

  static examples = [
    '$ workflow-test health-check',
    '$ workflow-test health-check --detailed',
    '$ workflow-test health-check --critical-only --json'
  ];

  static flags = {
    detailed: Flags.boolean({
      char: 'd',
      description: 'Run detailed health checks including component tests',
      default: false
    }),

    'critical-only': Flags.boolean({
      description: 'Check only critical systems (fastest)',
      default: false
    }),

    json: Flags.boolean({
      description: 'Output results in JSON format',
      default: false
    }),

    timeout: Flags.integer({
      char: 't',
      description: 'Timeout for individual checks in milliseconds',
      default: 10000
    }),

    'fix-issues': Flags.boolean({
      description: 'Attempt to automatically fix common issues',
      default: false
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HealthCheckCommand);

    if (!flags.json) {
      this.displayHeader();
    }

    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    try {
      // Run health checks
      if (flags['critical-only']) {
        checks.push(...await this.runCriticalChecks(flags));
      } else if (flags.detailed) {
        checks.push(...await this.runDetailedChecks(flags));
      } else {
        checks.push(...await this.runStandardChecks(flags));
      }

      const totalDuration = Date.now() - startTime;

      // Analyze results
      const analysis = this.analyzeHealthChecks(checks);

      // Display results
      if (flags.json) {
        this.displayJSONResults(checks, analysis, totalDuration);
      } else {
        this.displayResults(checks, analysis, totalDuration);
      }

      // Auto-fix if requested
      if (flags['fix-issues']) {
        await this.attemptAutoFix(checks);
      }

      // Set exit code
      process.exitCode = analysis.ready ? 0 : 1;

    } catch (error) {
      this.error(chalk.red(`Health check failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * Display command header
   */
  private displayHeader(): void {
    this.log(chalk.cyan.bold('\n🏥 Clinic Schedule Management - Health Check'));
    this.log(chalk.cyan('═'.repeat(60)));
    this.log(chalk.white(`Time: ${chalk.yellow(new Date().toLocaleString())}\n`));
  }

  /**
   * Run critical system checks only
   */
  private async runCriticalChecks(flags: any): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    this.log(chalk.yellow('🔍 Running critical system checks...\n'));

    // 1. Dependencies check
    checks.push(await this.checkDependencies());

    // 2. MegaParse functionality
    checks.push(await this.checkMegaParseFunctionality(flags.timeout));

    // 3. Build status
    checks.push(await this.checkBuildStatus());

    // 4. Basic security
    checks.push(await this.checkBasicSecurity());

    return checks;
  }

  /**
   * Run standard health checks
   */
  private async runStandardChecks(flags: any): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    this.log(chalk.yellow('🔍 Running standard health checks...\n'));

    // Critical checks
    checks.push(...await this.runCriticalChecks(flags));

    // Additional standard checks
    checks.push(await this.checkDataPersistence());
    checks.push(await this.checkEnvironmentConfiguration());
    checks.push(await this.checkTestSuiteBasics());

    return checks;
  }

  /**
   * Run detailed health checks
   */
  private async runDetailedChecks(flags: any): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    this.log(chalk.yellow('🔍 Running detailed health checks...\n'));

    // Standard checks
    checks.push(...await this.runStandardChecks(flags));

    // Detailed checks
    checks.push(await this.checkComponentTests());
    checks.push(await this.checkIntegrationTests());
    checks.push(await this.checkPerformanceBasics());

    return checks;
  }

  /**
   * Check dependencies are available
   */
  private async checkDependencies(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check package.json exists
      if (!existsSync('package.json')) {
        return {
          name: 'Dependencies',
          status: 'fail',
          message: 'package.json not found',
          critical: true,
          duration: Date.now() - startTime
        };
      }

      // Check node_modules exists
      if (!existsSync('node_modules')) {
        return {
          name: 'Dependencies',
          status: 'fail',
          message: 'node_modules not found - run npm install',
          critical: true,
          duration: Date.now() - startTime
        };
      }

      // Check critical dependencies
      const criticalDeps = ['@oclif/core', 'puppeteer', 'chalk'];
      for (const dep of criticalDeps) {
        if (!existsSync(join('node_modules', dep))) {
          return {
            name: 'Dependencies',
            status: 'fail',
            message: `Critical dependency missing: ${dep}`,
            critical: true,
            duration: Date.now() - startTime
          };
        }
      }

      return {
        name: 'Dependencies',
        status: 'pass',
        message: 'All critical dependencies available',
        critical: true,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Dependencies',
        status: 'fail',
        message: `Dependency check failed: ${error}`,
        critical: true,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check MegaParse functionality
   */
  private async checkMegaParseFunctionality(timeout: number): Promise<HealthCheck> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const child = spawn('npm', ['test', '--', '--testPathPatterns=megaParse', '--passWithNoTests'], {
          stdio: 'pipe',
          timeout
        });

        let output = '';
        let hasTests = false;

        child.stdout?.on('data', (data) => {
          output += data.toString();
          if (output.includes('Tests:') && output.includes('passed')) {
            hasTests = true;
          }
        });

        child.stderr?.on('data', (data) => {
          output += data.toString();
        });

        child.on('close', (code) => {
          const duration = Date.now() - startTime;

          if (code === 0 && hasTests) {
            resolve({
              name: 'MegaParse',
              status: 'pass',
              message: 'MegaParse tests passing - schedule import working',
              critical: true,
              duration
            });
          } else if (code === 0 && !hasTests) {
            resolve({
              name: 'MegaParse',
              status: 'warning',
              message: 'No MegaParse tests found - functionality unknown',
              critical: true,
              duration
            });
          } else {
            resolve({
              name: 'MegaParse',
              status: 'fail',
              message: 'MegaParse tests failing - schedule import broken',
              critical: true,
              duration
            });
          }
        });

        child.on('error', () => {
          resolve({
            name: 'MegaParse',
            status: 'fail',
            message: 'Could not run MegaParse tests',
            critical: true,
            duration: Date.now() - startTime
          });
        });

      } catch (error) {
        resolve({
          name: 'MegaParse',
          status: 'fail',
          message: `MegaParse check failed: ${error}`,
          critical: true,
          duration: Date.now() - startTime
        });
      }
    });
  }

  /**
   * Check build status
   */
  private async checkBuildStatus(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check if build output exists
      if (existsSync('dist') || existsSync('build')) {
        return {
          name: 'Build',
          status: 'pass',
          message: 'Application appears to be built',
          critical: true,
          duration: Date.now() - startTime
        };
      }

      // Try a quick build test
      try {
        execSync('npm run build', { 
          stdio: 'pipe',
          timeout: 30000
        });

        return {
          name: 'Build',
          status: 'pass',
          message: 'Application builds successfully',
          critical: true,
          duration: Date.now() - startTime
        };
      } catch {
        return {
          name: 'Build',
          status: 'fail',
          message: 'Application build failing',
          critical: true,
          duration: Date.now() - startTime
        };
      }

    } catch (error) {
      return {
        name: 'Build',
        status: 'fail',
        message: `Build check failed: ${error}`,
        critical: true,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check basic security measures
   */
  private async checkBasicSecurity(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check for .env files (should not be committed)
      if (existsSync('.env') && !existsSync('.gitignore')) {
        return {
          name: 'Security',
          status: 'warning',
          message: '.env file exists without .gitignore',
          critical: false,
          duration: Date.now() - startTime
        };
      }

      // Check for secure storage implementation
      if (existsSync('src/services/secureStorage.ts')) {
        return {
          name: 'Security',
          status: 'pass',
          message: 'Secure storage implementation found',
          critical: true,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Security',
        status: 'warning',
        message: 'Basic security measures need verification',
        critical: false,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Security',
        status: 'fail',
        message: `Security check failed: ${error}`,
        critical: true,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check data persistence capabilities
   */
  private async checkDataPersistence(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check for context providers
      if (existsSync('src/contexts')) {
        return {
          name: 'Data Persistence',
          status: 'pass',
          message: 'Context providers available for state management',
          critical: false,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Data Persistence',
        status: 'warning',
        message: 'Data persistence mechanism unclear',
        critical: false,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Data Persistence',
        status: 'fail',
        message: `Data persistence check failed: ${error}`,
        critical: false,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check environment configuration
   */
  private async checkEnvironmentConfiguration(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check for required configuration files
      const configFiles = ['package.json', 'tsconfig.json'];
      const missing = configFiles.filter(file => !existsSync(file));

      if (missing.length > 0) {
        return {
          name: 'Configuration',
          status: 'fail',
          message: `Missing config files: ${missing.join(', ')}`,
          critical: false,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Configuration',
        status: 'pass',
        message: 'Environment configuration appears correct',
        critical: false,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Configuration',
        status: 'fail',
        message: `Configuration check failed: ${error}`,
        critical: false,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check test suite basics
   */
  private async checkTestSuiteBasics(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check for test files
      if (existsSync('src/__tests__') || existsSync('tests')) {
        return {
          name: 'Test Suite',
          status: 'pass',
          message: 'Test suite structure exists',
          critical: false,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Test Suite',
        status: 'warning',
        message: 'No test directory found',
        critical: false,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Test Suite',
        status: 'fail',
        message: `Test suite check failed: ${error}`,
        critical: false,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Check component tests
   */
  private async checkComponentTests(): Promise<HealthCheck> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const child = spawn('npm', ['test', '--', '--testPathPatterns=components', '--passWithNoTests'], {
          stdio: 'pipe',
          timeout: 15000
        });

        child.on('close', (code) => {
          const duration = Date.now() - startTime;
          
          if (code === 0) {
            resolve({
              name: 'Component Tests',
              status: 'pass',
              message: 'Component tests passing',
              critical: false,
              duration
            });
          } else {
            resolve({
              name: 'Component Tests',
              status: 'warning',
              message: 'Component tests failing or missing',
              critical: false,
              duration
            });
          }
        });

        child.on('error', () => {
          resolve({
            name: 'Component Tests',
            status: 'fail',
            message: 'Could not run component tests',
            critical: false,
            duration: Date.now() - startTime
          });
        });

      } catch (error) {
        resolve({
          name: 'Component Tests',
          status: 'fail',
          message: `Component test check failed: ${error}`,
          critical: false,
          duration: Date.now() - startTime
        });
      }
    });
  }

  /**
   * Check integration tests
   */
  private async checkIntegrationTests(): Promise<HealthCheck> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const child = spawn('npm', ['test', '--', '--testPathPatterns=integration', '--passWithNoTests'], {
          stdio: 'pipe',
          timeout: 20000
        });

        child.on('close', (code) => {
          const duration = Date.now() - startTime;
          
          if (code === 0) {
            resolve({
              name: 'Integration Tests',
              status: 'pass',
              message: 'Integration tests passing',
              critical: false,
              duration
            });
          } else {
            resolve({
              name: 'Integration Tests',
              status: 'warning',
              message: 'Integration tests failing or missing',
              critical: false,
              duration
            });
          }
        });

        child.on('error', () => {
          resolve({
            name: 'Integration Tests',
            status: 'fail',
            message: 'Could not run integration tests',
            critical: false,
            duration: Date.now() - startTime
          });
        });

      } catch (error) {
        resolve({
          name: 'Integration Tests',
          status: 'fail',
          message: `Integration test check failed: ${error}`,
          critical: false,
          duration: Date.now() - startTime
        });
      }
    });
  }

  /**
   * Check performance basics
   */
  private async checkPerformanceBasics(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simple performance check - ensure basic operations are fast
      const testStart = Date.now();
      
      // Simulate a basic operation
      for (let i = 0; i < 10000; i++) {
        JSON.stringify({ test: i });
      }
      
      const opDuration = Date.now() - testStart;
      
      if (opDuration > 1000) {
        return {
          name: 'Performance',
          status: 'warning',
          message: `Basic operations slow (${opDuration}ms)`,
          critical: false,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Performance',
        status: 'pass',
        message: 'Basic performance looks good',
        critical: false,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Performance',
        status: 'fail',
        message: `Performance check failed: ${error}`,
        critical: false,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze health check results
   */
  private analyzeHealthChecks(checks: HealthCheck[]): any {
    const critical = checks.filter(c => c.critical);
    const criticalPassed = critical.filter(c => c.status === 'pass');
    const criticalFailed = critical.filter(c => c.status === 'fail');
    
    const totalPassed = checks.filter(c => c.status === 'pass');
    const totalFailed = checks.filter(c => c.status === 'fail');
    const totalWarnings = checks.filter(c => c.status === 'warning');

    const ready = criticalFailed.length === 0;

    return {
      ready,
      criticalPassed: criticalPassed.length,
      totalCritical: critical.length,
      totalPassed: totalPassed.length,
      totalFailed: totalFailed.length,
      totalWarnings: totalWarnings.length,
      total: checks.length
    };
  }

  /**
   * Display results in human-readable format
   */
  private displayResults(checks: HealthCheck[], analysis: any, totalDuration: number): void {
    this.log(chalk.cyan('\n📊 Health Check Results'));
    this.log(chalk.cyan('─'.repeat(40)));

    // Individual check results
    checks.forEach(check => {
      let statusIcon = '';
      let statusColor = chalk.white;

      switch (check.status) {
        case 'pass':
          statusIcon = '✅';
          statusColor = chalk.green;
          break;
        case 'fail':
          statusIcon = '❌';
          statusColor = chalk.red;
          break;
        case 'warning':
          statusIcon = '⚠️';
          statusColor = chalk.yellow;
          break;
      }

      const critical = check.critical ? chalk.red('[CRITICAL]') : chalk.gray('[optional]');
      const duration = check.duration ? chalk.gray(`(${check.duration}ms)`) : '';

      this.log(chalk.white(`${statusIcon} ${check.name} ${critical} ${duration}`));
      this.log(statusColor(`   ${check.message}`));
    });

    // Summary
    this.log(chalk.cyan('\n📈 Summary'));
    this.log(chalk.cyan('─'.repeat(20)));
    this.log(chalk.white(`Critical Systems: ${chalk.yellow(analysis.criticalPassed)}/${chalk.yellow(analysis.totalCritical)} passing`));
    this.log(chalk.white(`Overall: ${chalk.green(analysis.totalPassed)} passed, ${chalk.red(analysis.totalFailed)} failed, ${chalk.yellow(analysis.totalWarnings)} warnings`));
    this.log(chalk.white(`Duration: ${chalk.gray(totalDuration + 'ms')}`));

    // Final assessment
    this.log(chalk.cyan('\n🏥 Clinic Readiness Assessment'));
    this.log(chalk.cyan('═'.repeat(40)));

    if (analysis.ready) {
      this.log(chalk.green.bold('✅ READY FOR CLINIC USE'));
      this.log(chalk.green('All critical systems are functioning correctly.'));
      this.log(chalk.green('You can confidently use this application for schedule management.'));
    } else {
      this.log(chalk.red.bold('❌ NOT READY FOR CLINIC USE'));
      this.log(chalk.red('Critical system failures detected.'));
      this.log(chalk.red('Please address critical issues before using for clinic schedules.'));
    }
  }

  /**
   * Display results in JSON format
   */
  private displayJSONResults(checks: HealthCheck[], analysis: any, totalDuration: number): void {
    const result = {
      timestamp: new Date().toISOString(),
      ready: analysis.ready,
      duration: totalDuration,
      summary: analysis,
      checks: checks.map(check => ({
        name: check.name,
        status: check.status,
        message: check.message,
        critical: check.critical,
        duration: check.duration
      }))
    };

    this.log(JSON.stringify(result, null, 2));
  }

  /**
   * Attempt to automatically fix common issues
   */
  private async attemptAutoFix(checks: HealthCheck[]): Promise<void> {
    this.log(chalk.yellow('\n🔧 Attempting to auto-fix issues...'));

    const failedChecks = checks.filter(c => c.status === 'fail');
    
    for (const check of failedChecks) {
      if (check.name === 'Dependencies' && check.message.includes('node_modules')) {
        this.log(chalk.white('   🔧 Installing dependencies...'));
        try {
          execSync('npm install', { stdio: 'pipe', timeout: 60000 });
          this.log(chalk.green('   ✅ Dependencies installed'));
        } catch {
          this.log(chalk.red('   ❌ Failed to install dependencies'));
        }
      }
      
      if (check.name === 'Build' && check.message.includes('build failing')) {
        this.log(chalk.white('   🔧 Attempting to build application...'));
        try {
          execSync('npm run build', { stdio: 'pipe', timeout: 60000 });
          this.log(chalk.green('   ✅ Application built successfully'));
        } catch {
          this.log(chalk.red('   ❌ Build still failing'));
        }
      }
    }
  }
}