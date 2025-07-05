/**
 * Import Command - Schedule import testing
 * Tests complete schedule import workflow from file to Dashboard display
 */

import { Command, Flags, Args } from '@oclif/core';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import { TestOrchestrator } from '../lib/TestOrchestrator';
import { 
  TestConfig, 
  ImportMode, 
  ScheduleFormat,
  ImportCommandFlags 
} from '../../types/cli';

export default class ImportCommand extends Command {
  static summary = 'Test schedule import workflow with Dashboard verification';
  
  static description = `
Test complete schedule import workflow from file to Dashboard display.

This command:
1. Loads schedule file (or uses built-in test data)
2. Executes import using specified mode (MegaParse/Secure/Legacy)
3. Verifies patient data in application context
4. Checks Dashboard rendering and display
5. Takes screenshot for visual verification
6. Generates detailed test report

Examples:
  # Test MegaParse import with built-in data
  $ workflow-test import --mode=megaparse --screenshot --verify-count=4

  # Test with custom data file
  $ workflow-test import schedule.txt --mode=secure --output=./test-results

  # Test all modes for comparison
  $ workflow-test import --mode=megaparse --output=./megaparse-results
  $ workflow-test import --mode=secure --output=./secure-results
  $ workflow-test import --mode=legacy --output=./legacy-results
`;

  static examples = [
    '$ workflow-test import --mode=megaparse --screenshot',
    '$ workflow-test import schedule.txt --mode=secure --verify-count=5',
    '$ workflow-test import --mode=legacy --output=./test-results --timeout=60000'
  ];

  static args = {
    file: Args.string({
      description: 'Schedule file to import (uses built-in test data if not specified)',
      required: false
    })
  };

  static flags = {
    mode: Flags.string({
      char: 'm',
      description: 'Import mode to test',
      options: ['megaparse', 'secure', 'legacy'],
      default: 'megaparse',
      required: false
    }),

    format: Flags.string({
      char: 'f',
      description: 'Expected schedule format',
      options: ['lukner', 'tsv', 'auto'],
      default: 'auto',
      required: false
    }),

    output: Flags.string({
      char: 'o',
      description: 'Output directory for test results',
      default: './test-results',
      required: false
    }),

    screenshot: Flags.boolean({
      char: 's',
      description: 'Take screenshot of Dashboard after import',
      default: false
    }),

    'verify-count': Flags.integer({
      char: 'c',
      description: 'Expected number of patients to import (0 = any)',
      default: 0,
      required: false
    }),

    timeout: Flags.integer({
      char: 't',
      description: 'Timeout for import operation in milliseconds',
      default: 30000,
      required: false
    }),

    headless: Flags.boolean({
      description: 'Run browser in headless mode',
      default: true,
      allowNo: true
    }),

    verbose: Flags.boolean({
      char: 'v',
      description: 'Verbose output with detailed logs',
      default: false
    })
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ImportCommand);

    // Display header
    this.displayHeader(flags.mode as ImportMode, args.file);

    try {
      // Validate inputs
      await this.validateInputs(args, flags as any);

      // Prepare test configuration
      const config = this.createTestConfig(args, flags as any);

      // Create orchestrator and run test
      const orchestrator = new TestOrchestrator();
      const result = await orchestrator.runImportTest(config);

      // Display results
      this.displayResults(result, flags.verbose);

      // Generate report
      const reportPath = await orchestrator.generateReport(
        [result], 
        join(flags.output, 'import-test-report.json')
      );

      this.log(chalk.blue(`\n📊 Test report saved: ${reportPath}`));

      // Set exit code based on test result
      process.exitCode = result.success ? 0 : 1;

    } catch (error) {
      this.error(chalk.red(`Import test failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  }

  /**
   * Display command header
   */
  private displayHeader(mode: ImportMode, file?: string): void {
    this.log(chalk.cyan.bold('\n🧪 Schedule Import Testing'));
    this.log(chalk.cyan('─'.repeat(50)));
    this.log(chalk.white(`Mode: ${chalk.yellow(mode.toUpperCase())}`));
    this.log(chalk.white(`File: ${chalk.yellow(file || 'Built-in test data')}`));
    this.log(chalk.white(`Time: ${chalk.yellow(new Date().toLocaleString())}\n`));
  }

  /**
   * Validate command inputs
   */
  private async validateInputs(args: any, flags: any): Promise<void> {
    // Validate file exists if specified
    if (args.file && !existsSync(args.file)) {
      throw new Error(`Schedule file not found: ${args.file}`);
    }

    // Validate output directory
    if (!existsSync(flags.output)) {
      this.log(chalk.yellow(`Creating output directory: ${flags.output}`));
      mkdirSync(flags.output, { recursive: true });
    }

    // Validate timeout
    if (flags.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }

    // Validate verify-count
    if (flags['verify-count'] < 0) {
      throw new Error('verify-count must be non-negative');
    }
  }

  /**
   * Create test configuration from inputs
   */
  private createTestConfig(args: any, flags: any): TestConfig {
    return {
      mode: flags.mode as ImportMode,
      scheduleFile: args.file,
      format: flags.format as ScheduleFormat,
      expectedPatients: flags['verify-count'],
      timeout: flags.timeout,
      screenshotPath: flags.screenshot 
        ? join(flags.output, `screenshot-${flags.mode}-${Date.now()}.png`)
        : undefined,
      outputDir: flags.output,
      verifyDashboard: true // Always verify Dashboard for import command
    };
  }

  /**
   * Display test results
   */
  private displayResults(result: any, verbose: boolean): void {
    this.log(chalk.cyan('\n📋 Test Results'));
    this.log(chalk.cyan('─'.repeat(30)));

    // Overall status
    const statusIcon = result.success ? '✅' : '❌';
    const statusColor = result.success ? chalk.green : chalk.red;
    this.log(`${statusIcon} Status: ${statusColor(result.success ? 'PASSED' : 'FAILED')}`);

    // Key metrics
    this.log(chalk.white(`📊 Patients Imported: ${chalk.yellow(result.patientsImported)}`));
    this.log(chalk.white(`⏱️  Import Time: ${chalk.yellow(result.importTime + 'ms')}`));
    this.log(chalk.white(`🖥️  Dashboard Verified: ${result.dashboardVerified ? chalk.green('✓') : chalk.red('✗')}`));

    if (result.screenshotPath) {
      this.log(chalk.white(`📸 Screenshot: ${chalk.blue(result.screenshotPath)}`));
    }

    // Errors and warnings
    if (result.errors.length > 0) {
      this.log(chalk.red('\n❌ Errors:'));
      result.errors.forEach((error: string) => {
        this.log(chalk.red(`   • ${error}`));
      });
    }

    if (result.warnings.length > 0) {
      this.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach((warning: string) => {
        this.log(chalk.yellow(`   • ${warning}`));
      });
    }

    // Verbose logging
    if (verbose && result.logs.length > 0) {
      this.log(chalk.gray('\n📝 Detailed Logs:'));
      result.logs.forEach((log: string) => {
        this.log(chalk.gray(`   ${log}`));
      });
    }

    // Summary
    this.log(chalk.cyan('\n' + '─'.repeat(50)));
    if (result.success) {
      this.log(chalk.green.bold('🎉 Import test completed successfully!'));
    } else {
      this.log(chalk.red.bold('💥 Import test failed. Check errors above.'));
    }
  }
}