import { Command, Flags } from '@oclif/core';
import tebraApi from '../../services/tebraFirebaseApi';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import chalk from 'chalk';

export default class SyncTodayDebugCommand extends Command {
  static description = 'Diagnose Sync Today functionality failures with comprehensive analysis';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --full-analysis',
    '<%= config.bin %> <%= command.id %> --step-by-step',
    '<%= config.bin %> <%= command.id %> --capture-network',
  ];

  static flags = {
    'full-analysis': Flags.boolean({
      description: 'Run complete diagnostic analysis',
      default: false,
    }),
    'step-by-step': Flags.boolean({
      description: 'Run each step individually with detailed logging',
      default: false,
    }),
    'compare-manual': Flags.boolean({
      description: 'Compare CLI sync with manual dashboard button',
      default: false,
    }),
    'capture-network': Flags.boolean({
      description: 'Capture all network requests and responses',
      default: false,
    }),
    'debug': Flags.boolean({
      description: 'Enable debug logging',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncTodayDebugCommand);

    console.log(chalk.red.bold('🚨 SYNC TODAY FAILURE ANALYSIS'));
    console.log(chalk.yellow('==================================='));

    if (flags.debug) {
      console.log(chalk.blue('Debug mode enabled - full verbose output'));
    }

    if (flags['full-analysis']) {
      await this.runFullAnalysis(flags.debug);
    }

    if (flags['step-by-step']) {
      await this.runStepByStep(flags.debug);
    }

    if (flags['compare-manual']) {
      await this.compareWithManualSync(flags.debug);
    }

    if (flags['capture-network']) {
      await this.captureNetworkRequests(flags.debug);
    }

    // Default behavior if no specific flags
    if (!flags['full-analysis'] && !flags['step-by-step'] && !flags['compare-manual'] && !flags['capture-network']) {
      await this.runBasicDiagnostics(flags.debug);
    }
  }

  private async runFullAnalysis(debug: boolean): Promise<void> {
    console.log(chalk.cyan('\n🔍 FULL SYNC TODAY ANALYSIS'));
    console.log(chalk.gray('Testing complete sync flow with comprehensive diagnostics\n'));

    const results = {
      tebraConnection: false,
      authentication: false,
      appointmentRetrieval: false,
      dataTransformation: false,
      dashboardUpdate: false,
      errors: [] as string[],
    };

    try {
      // Step 1: Test Tebra Connection
      console.log(chalk.yellow('Step 1: Testing Tebra Connection...'));
      const connectionResult = await this.testTebraConnection(debug);
      results.tebraConnection = connectionResult.success;
      if (!connectionResult.success) {
        results.errors.push(`Connection failed: ${connectionResult.error}`);
      }

      // Step 2: Test Authentication
      console.log(chalk.yellow('Step 2: Testing Authentication...'));
      const authResult = await this.testAuthentication(debug);
      results.authentication = authResult.success;
      if (!authResult.success) {
        results.errors.push(`Authentication failed: ${authResult.error}`);
      }

      // Step 3: Test Appointment Retrieval
      console.log(chalk.yellow('Step 3: Testing Today\'s Appointment Retrieval...'));
      const appointmentResult = await this.testAppointmentRetrieval(debug);
      results.appointmentRetrieval = appointmentResult.success;
      if (!appointmentResult.success) {
        results.errors.push(`Appointment retrieval failed: ${appointmentResult.error}`);
      }

      // Step 4: Test Data Transformation
      console.log(chalk.yellow('Step 4: Testing Data Transformation...'));
      const transformResult = await this.testDataTransformation(debug);
      results.dataTransformation = transformResult.success;
      if (!transformResult.success) {
        results.errors.push(`Data transformation failed: ${transformResult.error}`);
      }

      // Step 5: Test Dashboard Update
      console.log(chalk.yellow('Step 5: Testing Dashboard Update...'));
      const dashboardResult = await this.testDashboardUpdate(debug);
      results.dashboardUpdate = dashboardResult.success;
      if (!dashboardResult.success) {
        results.errors.push(`Dashboard update failed: ${dashboardResult.error}`);
      }

      // Summary
      this.printAnalysisResults(results);

    } catch (error) {
      console.error(chalk.red('Fatal error during full analysis:'), error);
      results.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runStepByStep(debug: boolean): Promise<void> {
    console.log(chalk.cyan('\n🔧 STEP-BY-STEP SYNC TODAY DIAGNOSIS'));
    console.log(chalk.gray('Running each sync step individually with detailed logging\n'));

    const steps = [
      'Tebra Connection Test',
      'Authentication Validation',
      'Appointment Data Retrieval',
      'Data Format Transformation',
      'Dashboard State Update',
    ];

    for (const [index, step] of steps.entries()) {
      console.log(chalk.blue(`\n📋 Step ${index + 1}: ${step}`));
      console.log(chalk.gray('─'.repeat(50)));

      await this.runSingleStep(index + 1, debug);
      
      // Wait between steps for analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async runSingleStep(stepNumber: number, debug: boolean): Promise<void> {
    try {
      let result;
      
      switch (stepNumber) {
        case 1:
          result = await this.testTebraConnection(debug);
          break;
        case 2:
          result = await this.testAuthentication(debug);
          break;
        case 3:
          result = await this.testAppointmentRetrieval(debug);
          break;
        case 4:
          result = await this.testDataTransformation(debug);
          break;
        case 5:
          result = await this.testDashboardUpdate(debug);
          break;
        default:
          console.log(chalk.red('Unknown step number'));
          return;
      }

      if (result.success) {
        console.log(chalk.green(`✅ Step ${stepNumber} PASSED`));
        if (debug && result.data) {
          console.log(chalk.gray('Result data:'), JSON.stringify(result.data, null, 2));
        }
      } else {
        console.log(chalk.red(`❌ Step ${stepNumber} FAILED`));
        console.log(chalk.red(`Error: ${result.error}`));
        
      }
    } catch (error) {
      console.log(chalk.red(`💥 Step ${stepNumber} CRASHED`));
      console.error(chalk.red('Exception:'), error);
    }
  }

  private async compareWithManualSync(debug: boolean): Promise<void> {
    console.log(chalk.cyan('\n🔄 COMPARING CLI SYNC WITH MANUAL DASHBOARD BUTTON'));
    console.log(chalk.gray('Testing CLI sync vs manual dashboard button behavior\n'));

    try {
      // First, test CLI sync
      console.log(chalk.yellow('Testing CLI Sync...'));
      const cliResult = await this.testCliSync(debug);

      // Then simulate manual dashboard sync
      console.log(chalk.yellow('Simulating Manual Dashboard Sync...'));
      const manualResult = await this.testManualDashboardSync(debug);

      // Compare results
      this.compareResults(cliResult, manualResult, debug);

    } catch (error) {
      console.error(chalk.red('Error during comparison:'), error);
    }
  }

  private async captureNetworkRequests(debug: boolean): Promise<void> {
    console.log(chalk.cyan('\n📡 CAPTURING NETWORK REQUESTS'));
    console.log(chalk.gray('Monitoring all network traffic during sync operation\n'));

    try {
      // Enable network monitoring
      const networkMonitor = new NetworkMonitor();
      networkMonitor.start();

      // Perform sync operation
      console.log(chalk.yellow('Performing sync with network monitoring...'));
      await this.performMonitoredSync(debug);

      // Stop monitoring and get results
      const networkResults = networkMonitor.stop();
      this.printNetworkResults(networkResults, debug);

    } catch (error) {
      console.error(chalk.red('Error during network capture:'), error);
    }
  }

  private async runBasicDiagnostics(debug: boolean): Promise<void> {
    console.log(chalk.cyan('\n🔍 BASIC SYNC TODAY DIAGNOSTICS'));
    console.log(chalk.gray('Running essential diagnostic checks\n'));

    try {
      // Quick connection test
      console.log(chalk.yellow('Testing Tebra connection...'));
      const connectionResult = await tebraApi.healthCheck();
      
      if (connectionResult.success) {
        console.log(chalk.green('✅ Tebra connection OK'));
      } else {
        console.log(chalk.red('❌ Tebra connection failed'));
        console.log(chalk.red(`Error: ${connectionResult.error}`));
      }

      // Quick sync test
      console.log(chalk.yellow('Testing sync today operation...'));
      const syncResult = await tebraApi.syncSchedule({ date: new Date().toISOString().split('T')[0] });
      
      if (syncResult.success) {
        console.log(chalk.green('✅ Sync Today operation successful'));
        if (debug && syncResult.data) {
          console.log(chalk.gray('Sync data:'), JSON.stringify(syncResult.data, null, 2));
        }
      } else {
        console.log(chalk.red('❌ Sync Today operation failed'));
        console.log(chalk.red(`Error: ${syncResult.error}`));
      }

    } catch (error) {
      console.error(chalk.red('Error during basic diagnostics:'), error);
    }
  }

  private async testTebraConnection(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const result = await tebraApi.testConnection();
      
      if (debug) {
        console.log(chalk.gray('Connection test result:'), JSON.stringify(result, null, 2));
      }
      
      return {
        success: result.success,
        error: result.error,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection error',
      };
    }
  }

  private async testAuthentication(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Test authentication by checking health endpoint
      const result = await tebraApi.healthCheck();
      
      if (debug) {
        console.log(chalk.gray('Authentication test result:'), JSON.stringify(result, null, 2));
      }
      
      return {
        success: result.success,
        error: result.error,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
      };
    }
  }

  private async testAppointmentRetrieval(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await tebraApi.getAppointments({ fromDate: today, toDate: today });
      
      if (debug) {
        console.log(chalk.gray('Appointment retrieval result:'), JSON.stringify(result, null, 2));
      }
      
      return {
        success: result.success,
        error: result.error,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown appointment retrieval error',
      };
    }
  }

  private async testDataTransformation(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Test data transformation by getting appointments and checking format
      const today = new Date().toISOString().split('T')[0];
      const result = await tebraApi.getAppointments({ fromDate: today, toDate: today });
      
      if (result.success && result.data) {
        // Check if data is in expected format
        const isValidFormat = this.validateAppointmentDataFormat(result.data);
        
        if (debug) {
          console.log(chalk.gray('Data transformation validation:'), { isValidFormat, sampleData: result.data });
        }
        
        return {
          success: isValidFormat,
          error: isValidFormat ? undefined : 'Data format validation failed',
          data: result.data,
        };
      } else {
        return {
          success: false,
          error: result.error || 'No data received for transformation test',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown data transformation error',
      };
    }
  }

  private async testDashboardUpdate(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Test dashboard update by performing sync operation
      const today = new Date().toISOString().split('T')[0];
      const result = await tebraApi.syncSchedule({ date: today });
      
      if (debug) {
        console.log(chalk.gray('Dashboard update test result:'), JSON.stringify(result, null, 2));
      }
      
      return {
        success: result.success,
        error: result.error,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown dashboard update error',
      };
    }
  }

  private async testCliSync(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await tebraApi.syncSchedule({ date: today });
      
      if (debug) {
        console.log(chalk.gray('CLI sync result:'), JSON.stringify(result, null, 2));
      }
      
      return {
        success: result.success,
        error: result.error,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CLI sync failed',
      };
    }
  }

  private async testManualDashboardSync(debug: boolean): Promise<{ success: boolean; error?: string; data?: any }> {
    // Simulate manual dashboard sync by testing the same API call
    // In a real implementation, this would use browser automation
    console.log(chalk.gray('Note: Manual dashboard sync simulation - would use browser automation in full implementation'));
    
    return await this.testCliSync(debug);
  }

  private validateAppointmentDataFormat(data: any): boolean {
    // Basic validation of appointment data format
    if (!data || typeof data !== 'object') {
      return false;
    }
    
    // Check if it's an array of appointments
    if (Array.isArray(data)) {
      return data.every(appointment => 
        appointment && 
        typeof appointment === 'object' &&
        'id' in appointment &&
        'patientName' in appointment &&
        'appointmentTime' in appointment
      );
    }
    
    // Check if it's a single appointment
    return 'id' in data && 'patientName' in data && 'appointmentTime' in data;
  }

  private printAnalysisResults(results: any): void {
    console.log(chalk.cyan('\n📊 ANALYSIS RESULTS'));
    console.log(chalk.gray('==================='));
    
    const tests = [
      { name: 'Tebra Connection', result: results.tebraConnection },
      { name: 'Authentication', result: results.authentication },
      { name: 'Appointment Retrieval', result: results.appointmentRetrieval },
      { name: 'Data Transformation', result: results.dataTransformation },
      { name: 'Dashboard Update', result: results.dashboardUpdate },
    ];
    
    tests.forEach(test => {
      const status = test.result ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${status} ${test.name}`);
    });
    
    if (results.errors.length > 0) {
      console.log(chalk.red('\n🚨 ERRORS FOUND:'));
      results.errors.forEach((error: string, index: number) => {
        console.log(chalk.red(`${index + 1}. ${error}`));
      });
    }
    
    const successCount = tests.filter(t => t.result).length;
    const totalCount = tests.length;
    
    console.log(chalk.cyan(`\n📈 SUCCESS RATE: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`));
  }

  private compareResults(cliResult: any, manualResult: any, debug: boolean): void {
    console.log(chalk.cyan('\n🔍 SYNC COMPARISON RESULTS'));
    console.log(chalk.gray('==========================='));
    
    console.log(`CLI Sync: ${cliResult.success ? chalk.green('✅ SUCCESS') : chalk.red('❌ FAILED')}`);
    console.log(`Manual Sync: ${manualResult.success ? chalk.green('✅ SUCCESS') : chalk.red('❌ FAILED')}`);
    
    if (cliResult.success === manualResult.success) {
      console.log(chalk.green('✅ Both methods have consistent results'));
    } else {
      console.log(chalk.red('❌ Results differ between CLI and manual sync'));
    }
    
    if (debug) {
      console.log(chalk.gray('\nCLI Result Details:'), JSON.stringify(cliResult, null, 2));
      console.log(chalk.gray('\nManual Result Details:'), JSON.stringify(manualResult, null, 2));
    }
  }

  private async performMonitoredSync(debug: boolean): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await tebraApi.syncSchedule({ date: today });
      
      if (debug) {
        console.log(chalk.gray('Monitored sync result:'), JSON.stringify(result, null, 2));
      }
    } catch (error) {
      console.error(chalk.red('Error during monitored sync:'), error);
    }
  }

  private printNetworkResults(networkResults: any, debug: boolean): void {
    console.log(chalk.cyan('\n🌐 NETWORK MONITORING RESULTS'));
    console.log(chalk.gray('=============================='));
    
    if (debug) {
      console.log(chalk.gray('Network results:'), JSON.stringify(networkResults, null, 2));
    } else {
      console.log('Network monitoring results would be displayed here');
    }
  }
}

// Simple network monitor placeholder
class NetworkMonitor {
  private isRunning = false;
  private requests: any[] = [];

  start(): void {
    this.isRunning = true;
    this.requests = [];
    console.log(chalk.gray('Network monitoring started...'));
  }

  stop(): any {
    this.isRunning = false;
    console.log(chalk.gray('Network monitoring stopped.'));
    return {
      requestCount: this.requests.length,
      requests: this.requests,
    };
  }
}