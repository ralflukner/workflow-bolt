/**
 * Verify Command - Dashboard state verification
 * Verifies current Dashboard state matches expected data
 */

import { Command, Flags } from '@oclif/core';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import { BrowserController } from '../lib/BrowserController';
import { 
  VerifyCommandFlags,
  ExpectedDashboardState,
  VerificationResult
} from '../../types/cli';

export default class VerifyCommand extends Command {
  static summary = 'Verify current Dashboard state matches expected data';
  
  static description = `
Verify that the current Dashboard state matches expected patient data and UI elements.

This command:
1. Connects to running application
2. Inspects current Dashboard state
3. Verifies patient count and data
4. Checks UI element visibility and content
5. Takes verification screenshot
6. Generates verification report

Use this command after manually importing data or to verify application state.

Examples:
  # Verify Dashboard has 4 patients
  $ workflow-test verify --patients=4 --screenshot

  # Verify specific provider and date
  $ workflow-test verify --patients=3 --provider="RALF LUKNER" --date="2025-07-01"

  # Quick verification with screenshot
  $ workflow-test verify --screenshot --output=./verification-results
`;

  static examples = [
    '$ workflow-test verify --patients=4 --screenshot',
    '$ workflow-test verify --provider="RALF LUKNER" --date="2025-07-01"',
    '$ workflow-test verify --screenshot --output=./verification --verbose'
  ];

  static flags = {
    patients: Flags.integer({
      char: 'p',
      description: 'Expected number of patients displayed',
      required: false
    }),

    provider: Flags.string({
      description: 'Expected provider name',
      required: false
    }),

    date: Flags.string({
      char: 'd',
      description: 'Expected schedule date (YYYY-MM-DD)',
      required: false
    }),

    screenshot: Flags.boolean({
      char: 's',
      description: 'Take verification screenshot',
      default: false
    }),

    output: Flags.string({
      char: 'o',
      description: 'Output directory for verification results',
      default: './verification-results',
      required: false
    }),

    timeout: Flags.integer({
      char: 't',
      description: 'Timeout for verification in milliseconds',
      default: 15000,
      required: false
    }),

    verbose: Flags.boolean({
      char: 'v',
      description: 'Verbose output with detailed verification steps',
      default: false
    }),

    url: Flags.string({
      char: 'u',
      description: 'Application URL to verify',
      default: 'http://localhost:5173',
      required: false
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(VerifyCommand);

    // Display header
    this.displayHeader();

    let browserController: BrowserController | undefined;

    try {
      // Validate inputs
      await this.validateInputs(flags as any);

      // Launch browser
      browserController = new BrowserController();
      await browserController.launch({
        headless: true,
        viewport: { width: 1280, height: 720 },
        timeout: flags.timeout,
        devtools: false
      });

      // Navigate to application
      this.log(chalk.white(`🌐 Connecting to application: ${flags.url}`));
      await browserController.navigateToApp(flags.url);

      // Get current Dashboard state
      this.log(chalk.white('🔍 Inspecting Dashboard state...'));
      const dashboardState = await browserController.getDashboardState();

      // Prepare expected state
      const expectedState = this.createExpectedState(flags as any);

      // Perform verification
      const verificationResult = await this.verifyDashboardState(
        dashboardState, 
        expectedState, 
        flags.verbose
      );

      // Take screenshot if requested
      if (flags.screenshot) {
        const screenshotPath = join(flags.output, `verification-${Date.now()}.png`);
        await browserController.takeScreenshot(screenshotPath);
        this.log(chalk.blue(`📸 Screenshot saved: ${screenshotPath}`));
      }

      // Display verification results
      this.displayVerificationResults(verificationResult, dashboardState, flags.verbose);

      // Generate verification report
      const reportPath = await this.generateVerificationReport(
        verificationResult, 
        dashboardState, 
        expectedState,
        flags.output
      );

      this.log(chalk.blue(`\n📊 Verification report saved: ${reportPath}`));

      // Set exit code based on verification result
      process.exitCode = verificationResult.success ? 0 : 1;

    } catch (error) {
      this.error(chalk.red(`Dashboard verification failed: ${error instanceof Error ? error.message : String(error)}`));
    } finally {
      // Clean up browser
      if (browserController) {
        await browserController.close();
      }
    }
  }

  /**
   * Display command header
   */
  private displayHeader(): void {
    this.log(chalk.cyan.bold('\n🔍 Dashboard State Verification'));
    this.log(chalk.cyan('─'.repeat(50)));
    this.log(chalk.white(`Time: ${chalk.yellow(new Date().toLocaleString())}\n`));
  }

  /**
   * Validate command inputs
   */
  private async validateInputs(flags: any): Promise<void> {
    // Validate output directory
    if (!existsSync(flags.output)) {
      this.log(chalk.yellow(`Creating output directory: ${flags.output}`));
      mkdirSync(flags.output, { recursive: true });
    }

    // Validate timeout
    if (flags.timeout < 1000) {
      throw new Error('Timeout must be at least 1000ms');
    }

    // Validate patient count
    if (flags.patients !== undefined && flags.patients < 0) {
      throw new Error('Patient count must be non-negative');
    }

    // Validate date format
    if (flags.date && !/^\d{4}-\d{2}-\d{2}$/.test(flags.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    // Validate URL
    try {
      new URL(flags.url);
    } catch {
      throw new Error(`Invalid URL: ${flags.url}`);
    }
  }

  /**
   * Create expected state from flags
   */
  private createExpectedState(flags: any): ExpectedDashboardState {
    return {
      patients: flags.patients || 0,
      provider: flags.provider,
      date: flags.date,
      specificPatients: [], // Could be extended to check specific patients
      uiElements: [
        {
          selector: '[data-testid="patient-list"], .patient-list',
          shouldBeVisible: true
        },
        {
          selector: '[data-testid="dashboard-header"], .dashboard-header',
          shouldBeVisible: true
        }
      ]
    };
  }

  /**
   * Verify Dashboard state against expectations
   */
  private async verifyDashboardState(
    actualState: any,
    expectedState: ExpectedDashboardState,
    verbose: boolean
  ): Promise<VerificationResult> {
    const startTime = Date.now();
    const passed: any[] = [];
    const failed: any[] = [];
    const warnings: any[] = [];

    if (verbose) {
      this.log(chalk.gray('🔍 Running verification checks...'));
    }

    // Check patient count
    if (expectedState.patients > 0) {
      const check = {
        name: 'Patient Count',
        type: 'patient_count' as const,
        expected: expectedState.patients,
        actual: actualState.patientsDisplayed,
        passed: actualState.patientsDisplayed === expectedState.patients,
        message: `Expected ${expectedState.patients} patients, found ${actualState.patientsDisplayed}`
      };

      if (check.passed) {
        passed.push(check);
        if (verbose) this.log(chalk.green(`  ✓ ${check.message}`));
      } else {
        failed.push(check);
        if (verbose) this.log(chalk.red(`  ✗ ${check.message}`));
      }
    }

    // Check provider
    if (expectedState.provider) {
      const check = {
        name: 'Provider Name',
        type: 'state' as const,
        expected: expectedState.provider,
        actual: actualState.currentProvider,
        passed: actualState.currentProvider === expectedState.provider,
        message: `Expected provider "${expectedState.provider}", found "${actualState.currentProvider}"`
      };

      if (check.passed) {
        passed.push(check);
        if (verbose) this.log(chalk.green(`  ✓ ${check.message}`));
      } else {
        failed.push(check);
        if (verbose) this.log(chalk.red(`  ✗ ${check.message}`));
      }
    }

    // Check schedule date
    if (expectedState.date) {
      const check = {
        name: 'Schedule Date',
        type: 'state' as const,
        expected: expectedState.date,
        actual: actualState.scheduleDate,
        passed: actualState.scheduleDate.includes(expectedState.date),
        message: `Expected date "${expectedState.date}", found "${actualState.scheduleDate}"`
      };

      if (check.passed) {
        passed.push(check);
        if (verbose) this.log(chalk.green(`  ✓ ${check.message}`));
      } else {
        warnings.push(check); // Date mismatch is often a warning, not failure
        if (verbose) this.log(chalk.yellow(`  ⚠ ${check.message}`));
      }
    }

    // Check UI elements
    for (const expectedElement of expectedState.uiElements || []) {
      const actualElement = actualState.uiElements.find(
        (el: any) => el.selector === expectedElement.selector
      );

      const check = {
        name: `UI Element: ${expectedElement.selector}`,
        type: 'ui_element' as const,
        expected: expectedElement.shouldBeVisible,
        actual: !!actualElement?.visible,
        passed: expectedElement.shouldBeVisible === !!actualElement?.visible,
        message: `Element "${expectedElement.selector}" ${expectedElement.shouldBeVisible ? 'should be' : 'should not be'} visible`
      };

      if (check.passed) {
        passed.push(check);
        if (verbose) this.log(chalk.green(`  ✓ ${check.message}`));
      } else {
        failed.push(check);
        if (verbose) this.log(chalk.red(`  ✗ ${check.message}`));
      }
    }

    // General state checks
    if (actualState.loadingState) {
      warnings.push({
        name: 'Loading State',
        type: 'state' as const,
        expected: false,
        actual: true,
        passed: false,
        message: 'Dashboard is still in loading state'
      });
      if (verbose) this.log(chalk.yellow('  ⚠ Dashboard is still loading'));
    }

    if (actualState.errorState) {
      failed.push({
        name: 'Error State',
        type: 'state' as const,
        expected: null,
        actual: actualState.errorState,
        passed: false,
        message: `Dashboard has error: ${actualState.errorState}`
      });
      if (verbose) this.log(chalk.red(`  ✗ Dashboard error: ${actualState.errorState}`));
    }

    const checkDuration = Date.now() - startTime;
    const success = failed.length === 0;

    return {
      success,
      passed,
      failed,
      warnings,
      summary: `${passed.length} passed, ${failed.length} failed, ${warnings.length} warnings`,
      details: {
        totalChecks: passed.length + failed.length + warnings.length,
        passedChecks: passed.length,
        failedChecks: failed.length,
        warningChecks: warnings.length,
        checkDuration,
        screenshotTaken: false // Set by caller
      }
    };
  }

  /**
   * Display verification results
   */
  private displayVerificationResults(
    result: VerificationResult, 
    dashboardState: any, 
    verbose: boolean
  ): void {
    this.log(chalk.cyan('\n📋 Verification Results'));
    this.log(chalk.cyan('─'.repeat(40)));

    // Overall status
    const statusIcon = result.success ? '✅' : '❌';
    const statusColor = result.success ? chalk.green : chalk.red;
    this.log(`${statusIcon} Status: ${statusColor(result.success ? 'PASSED' : 'FAILED')}`);

    // Summary
    this.log(chalk.white(`📊 Summary: ${chalk.yellow(result.summary)}`));
    this.log(chalk.white(`⏱️  Check Duration: ${chalk.yellow(result.details.checkDuration + 'ms')}`));

    // Dashboard state overview
    this.log(chalk.white(`\n🖥️  Dashboard State:`));
    this.log(chalk.white(`   • Patients Displayed: ${chalk.yellow(dashboardState.patientsDisplayed)}`));
    this.log(chalk.white(`   • Current Provider: ${chalk.yellow(dashboardState.currentProvider)}`));
    this.log(chalk.white(`   • Schedule Date: ${chalk.yellow(dashboardState.scheduleDate)}`));
    this.log(chalk.white(`   • Loading: ${dashboardState.loadingState ? chalk.red('Yes') : chalk.green('No')}`));
    
    if (dashboardState.errorState) {
      this.log(chalk.white(`   • Error: ${chalk.red(dashboardState.errorState)}`));
    }

    // Failed checks
    if (result.failed.length > 0) {
      this.log(chalk.red('\n❌ Failed Checks:'));
      result.failed.forEach((check: any) => {
        this.log(chalk.red(`   • ${check.message}`));
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      this.log(chalk.yellow('\n⚠️  Warnings:'));
      result.warnings.forEach((warning: any) => {
        this.log(chalk.yellow(`   • ${warning.message}`));
      });
    }

    // Verbose details
    if (verbose && result.passed.length > 0) {
      this.log(chalk.green('\n✅ Passed Checks:'));
      result.passed.forEach((check: any) => {
        this.log(chalk.green(`   • ${check.message}`));
      });
    }

    // Summary
    this.log(chalk.cyan('\n' + '─'.repeat(50)));
    if (result.success) {
      this.log(chalk.green.bold('🎉 Dashboard verification completed successfully!'));
    } else {
      this.log(chalk.red.bold('💥 Dashboard verification failed. Check failed checks above.'));
    }
  }

  /**
   * Generate verification report
   */
  private async generateVerificationReport(
    result: VerificationResult,
    dashboardState: any,
    expectedState: ExpectedDashboardState,
    outputDir: string
  ): Promise<string> {
    const reportPath = join(outputDir, `verification-report-${Date.now()}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      verification: result,
      dashboardState,
      expectedState,
      metadata: {
        version: '1.0',
        generatedBy: 'workflow-test verify command'
      }
    };

    const fs = require('fs');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return reportPath;
  }
}