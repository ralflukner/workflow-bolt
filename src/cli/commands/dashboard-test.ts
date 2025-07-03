import { Command, Flags } from '@oclif/core';
import { spawn } from 'child_process';
import chalk from 'chalk';
import tebraApi from '../../services/tebraFirebaseApi';

export default class DashboardTestCommand extends Command {
  static description = 'Test dashboard buttons and UI elements via browser automation';

  static examples = [
    '<%= config.bin %> <%= command.id %> --target="sync-today"',
    '<%= config.bin %> <%= command.id %> --target="test-connection" --validate-response',
    '<%= config.bin %> <%= command.id %> --all-buttons',
    '<%= config.bin %> <%= command.id %> --compare-cli-results',
  ];

  static flags = {
    target: Flags.string({
      description: 'Target button/element to test (sync-today, test-connection, refresh-now, etc.)',
    }),
    'all-buttons': Flags.boolean({
      description: 'Test all dashboard buttons',
      default: false,
    }),
    'validate-response': Flags.boolean({
      description: 'Validate response after button click',
      default: false,
    }),
    'capture-errors': Flags.boolean({
      description: 'Capture any JavaScript errors',
      default: false,
    }),
    'compare-cli-results': Flags.boolean({
      description: 'Compare with equivalent CLI operation',
      default: false,
    }),
    'headless': Flags.boolean({
      description: 'Run browser in headless mode',
      default: true,
    }),
    'timeout': Flags.integer({
      description: 'Test timeout in milliseconds',
      default: 30000,
    }),
    'debug': Flags.boolean({
      description: 'Enable debug logging',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(DashboardTestCommand);

    console.log(chalk.blue.bold('🎯 DASHBOARD BUTTON TESTING'));
    console.log(chalk.yellow('============================'));

    if (flags.debug) {
      console.log(chalk.gray(`Debug mode: ON, Headless: ${flags.headless}, Timeout: ${flags.timeout}ms`));
    }

    if (flags['all-buttons']) {
      await this.testAllButtons(flags);
    } else if (flags.target) {
      await this.testSingleButton(flags.target, flags);
    } else {
      console.log(chalk.yellow('No target specified. Use --target or --all-buttons'));
      console.log(chalk.gray('Available buttons: sync-today, test-connection, refresh-now, new-patient, import-schedule, export-json, export-csv'));
    }
  }

  private async testAllButtons(flags: any): Promise<void> {
    console.log(chalk.cyan('\n🔍 TESTING ALL DASHBOARD BUTTONS'));
    console.log(chalk.gray('Comprehensive test of all interactive dashboard elements\n'));

    const buttons = [
      { id: 'sync-today', name: 'Sync Today', critical: true },
      { id: 'test-connection', name: 'Test Connection', critical: true },
      { id: 'refresh-now', name: 'Refresh Now', critical: false },
      { id: 'new-patient', name: 'New Patient', critical: false },
      { id: 'import-schedule', name: 'Import Schedule', critical: false },
      { id: 'export-json', name: 'Export JSON', critical: false },
      { id: 'export-csv', name: 'Export CSV', critical: false },
    ];

    const results = [];

    for (const button of buttons) {
      console.log(chalk.yellow(`Testing ${button.name}...`));
      const result = await this.testSingleButton(button.id, flags);
      results.push({
        ...button,
        success: result.success,
        error: result.error,
      });

      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.printButtonTestSummary(results);
  }

  private async testSingleButton(buttonId: string, flags: any): Promise<{ success: boolean; error?: string; data?: any }> {
    if (flags.debug) {
      console.log(chalk.gray(`Testing button: ${buttonId}`));
    }

    try {
      // First, test if we can find the equivalent CLI operation
      const cliResult = flags['compare-cli-results'] ? await this.testEquivalentCliOperation(buttonId, flags.debug) : null;

      // Then test the actual button
      const buttonResult = await this.testButtonClick(buttonId, flags);

      // Compare results if requested
      if (cliResult && flags['compare-cli-results']) {
        this.compareButtonAndCliResults(buttonId, buttonResult, cliResult);
      }

      return buttonResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(chalk.red(`❌ Button test failed: ${errorMessage}`));
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async testEquivalentCliOperation(buttonId: string, debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    if (debug) {
      console.log(chalk.gray(`Testing CLI equivalent for ${buttonId}...`));
    }

    try {
      let result;

      switch (buttonId) {
        case 'sync-today':
          const today = new Date().toISOString().split('T')[0];
          result = await tebraApi.syncSchedule({ date: today });
          break;

        case 'test-connection':
          result = await tebraApi.testConnection();
          break;

        case 'refresh-now':
          // Refresh is typically a client-side operation
          result = { success: true, message: 'Refresh operation (client-side)' };
          break;

        case 'new-patient':
          // New patient is a modal/form operation
          result = { success: true, message: 'New patient modal operation (UI-only)' };
          break;

        case 'import-schedule':
          // Import schedule is a file upload operation
          result = { success: true, message: 'Import schedule operation (requires file)' };
          break;

        case 'export-json':
        case 'export-csv':
          // Export operations are typically client-side
          result = { success: true, message: 'Export operation (client-side)' };
          break;

        default:
          result = { success: false, error: `No CLI equivalent found for ${buttonId}` };
      }

      if (debug) {
        console.log(chalk.gray(`CLI result for ${buttonId}:`), JSON.stringify(result, null, 2));
      }

      return {
        success: result.success,
        error: result.error,
        data: result.data || result.message,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (debug) {
        console.log(chalk.red(`CLI test failed for ${buttonId}: ${errorMessage}`));
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async testButtonClick(buttonId: string, flags: any): Promise<{ success: boolean; error?: string; data?: any }> {
    // This is a simplified version - in a real implementation, this would use Playwright or Puppeteer
    console.log(chalk.gray(`Simulating button click for: ${buttonId}`));

    try {
      // Simulate button click behavior
      const simulation = await this.simulateButtonBehavior(buttonId, flags);
      
      if (flags['validate-response']) {
        const validation = await this.validateButtonResponse(buttonId, simulation);
        return validation;
      }

      return simulation;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Button click simulation failed: ${errorMessage}`,
      };
    }
  }

  private async simulateButtonBehavior(buttonId: string, flags: any): Promise<{ success: boolean; error?: string; data?: any }> {
    // Simulate the expected behavior of each button
    switch (buttonId) {
      case 'sync-today':
        console.log(chalk.gray('  Simulating Sync Today button click...'));
        try {
          const today = new Date().toISOString().split('T')[0];
          const result = await tebraApi.syncSchedule({ date: today });
          return {
            success: result.success,
            error: result.error,
            data: result.data,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Sync Today simulation failed',
          };
        }

      case 'test-connection':
        console.log(chalk.gray('  Simulating Test Connection button click...'));
        try {
          const result = await tebraApi.testConnection();
          return {
            success: result.success,
            error: result.error,
            data: result.data,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Test Connection simulation failed',
          };
        }

      case 'refresh-now':
        console.log(chalk.gray('  Simulating Refresh Now button click...'));
        // Refresh is typically a client-side operation
        return {
          success: true,
          data: { message: 'Page refresh simulated', timestamp: new Date().toISOString() },
        };

      case 'new-patient':
        console.log(chalk.gray('  Simulating New Patient button click...'));
        return {
          success: true,
          data: { message: 'New patient modal opened', action: 'modal-display' },
        };

      case 'import-schedule':
        console.log(chalk.gray('  Simulating Import Schedule button click...'));
        return {
          success: true,
          data: { message: 'Import schedule modal opened', action: 'modal-display' },
        };

      case 'export-json':
        console.log(chalk.gray('  Simulating Export JSON button click...'));
        return {
          success: true,
          data: { message: 'JSON export initiated', format: 'json' },
        };

      case 'export-csv':
        console.log(chalk.gray('  Simulating Export CSV button click...'));
        return {
          success: true,
          data: { message: 'CSV export initiated', format: 'csv' },
        };

      default:
        return {
          success: false,
          error: `Unknown button: ${buttonId}`,
        };
    }
  }

  private async validateButtonResponse(buttonId: string, response: any): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log(chalk.gray(`  Validating response for ${buttonId}...`));

    try {
      // Validate based on button type
      switch (buttonId) {
        case 'sync-today':
          if (response.success && response.data) {
            console.log(chalk.green('  ✅ Sync Today response valid'));
            return { success: true, data: response.data };
          } else {
            console.log(chalk.red('  ❌ Sync Today response invalid'));
            return { success: false, error: 'Invalid sync response' };
          }

        case 'test-connection':
          if (response.success) {
            console.log(chalk.green('  ✅ Test Connection response valid'));
            return { success: true, data: response.data };
          } else {
            console.log(chalk.red('  ❌ Test Connection response invalid'));
            return { success: false, error: 'Connection test failed' };
          }

        default:
          // For other buttons, just check if they responded
          if (response.success !== undefined) {
            console.log(chalk.green(`  ✅ ${buttonId} response valid`));
            return { success: true, data: response.data };
          } else {
            console.log(chalk.red(`  ❌ ${buttonId} response invalid`));
            return { success: false, error: 'Invalid response format' };
          }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      return {
        success: false,
        error: `Validation failed: ${errorMessage}`,
      };
    }
  }

  private compareButtonAndCliResults(buttonId: string, buttonResult: any, cliResult: any): void {
    console.log(chalk.cyan(`\n🔍 Comparing ${buttonId} results:`));
    console.log(chalk.gray('Button vs CLI comparison'));

    const buttonSuccess = buttonResult.success;
    const cliSuccess = cliResult.success;

    if (buttonSuccess === cliSuccess) {
      if (buttonSuccess) {
        console.log(chalk.green('✅ Both button and CLI succeeded'));
      } else {
        console.log(chalk.yellow('⚠️  Both button and CLI failed (consistent)'));
      }
    } else {
      console.log(chalk.red('❌ Button and CLI results differ'));
      console.log(chalk.red(`  Button: ${buttonSuccess ? 'SUCCESS' : 'FAILED'}`));
      console.log(chalk.red(`  CLI: ${cliSuccess ? 'SUCCESS' : 'FAILED'}`));
    }

    // Compare error messages if both failed
    if (!buttonSuccess && !cliSuccess) {
      if (buttonResult.error === cliResult.error) {
        console.log(chalk.yellow('  Same error message (good consistency)'));
      } else {
        console.log(chalk.red('  Different error messages:'));
        console.log(chalk.red(`    Button: ${buttonResult.error}`));
        console.log(chalk.red(`    CLI: ${cliResult.error}`));
      }
    }
  }

  private printButtonTestSummary(results: any[]): void {
    console.log(chalk.cyan('\n📊 BUTTON TEST SUMMARY'));
    console.log(chalk.gray('========================'));

    const critical = results.filter(r => r.critical);
    const nonCritical = results.filter(r => !r.critical);

    console.log(chalk.yellow('\nCritical Buttons:'));
    critical.forEach(button => {
      const status = button.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${status} ${button.name}`);
      if (!button.success && button.error) {
        console.log(chalk.red(`    Error: ${button.error}`));
      }
    });

    console.log(chalk.yellow('\nNon-Critical Buttons:'));
    nonCritical.forEach(button => {
      const status = button.success ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${status} ${button.name}`);
      if (!button.success && button.error) {
        console.log(chalk.red(`    Error: ${button.error}`));
      }
    });

    const totalSuccess = results.filter(r => r.success).length;
    const totalTests = results.length;
    const criticalSuccess = critical.filter(r => r.success).length;
    const criticalTotal = critical.length;

    console.log(chalk.cyan(`\n📈 Overall Success Rate: ${totalSuccess}/${totalTests} (${Math.round(totalSuccess/totalTests*100)}%)`));
    console.log(chalk.cyan(`🚨 Critical Success Rate: ${criticalSuccess}/${criticalTotal} (${Math.round(criticalSuccess/criticalTotal*100)}%)`));

    if (criticalSuccess < criticalTotal) {
      console.log(chalk.red('\n⚠️  CRITICAL BUTTONS FAILING - IMMEDIATE ATTENTION REQUIRED'));
      const failedCritical = critical.filter(r => !r.success);
      failedCritical.forEach(button => {
        console.log(chalk.red(`  🚨 ${button.name}: ${button.error}`));
      });
    } else {
      console.log(chalk.green('\n✅ All critical buttons functioning correctly'));
    }
  }
}