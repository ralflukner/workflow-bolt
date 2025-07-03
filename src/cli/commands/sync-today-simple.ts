import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';

export default class SyncTodaySimpleCommand extends Command {
  static description = 'Simple Sync Today diagnostic command';

  static flags = {
    debug: Flags.boolean({
      description: 'Enable debug logging',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(SyncTodaySimpleCommand);

    console.log(chalk.red.bold('🚨 SYNC TODAY FAILURE ANALYSIS'));
    console.log(chalk.yellow('==================================='));

    try {
      // Import tebraApi dynamically to avoid build-time issues
      const { default: tebraApi } = await import('../../services/tebraFirebaseApi.js');
      
      console.log(chalk.cyan('\n🔍 Testing Sync Today Functionality'));
      
      // Step 1: Test connection
      console.log(chalk.yellow('Step 1: Testing Tebra connection...'));
      try {
        const connectionResult = await tebraApi.testConnection();
        if (flags.debug) {
          console.log(chalk.gray('Connection result:'), JSON.stringify(connectionResult, null, 2));
        }
        
        if (connectionResult && (connectionResult as any).success) {
          console.log(chalk.green('✅ Tebra connection OK'));
        } else {
          console.log(chalk.red('❌ Tebra connection failed'));
          console.log(chalk.red(`Error: ${(connectionResult as any)?.error}`));
        }
      } catch (error) {
        console.log(chalk.red('💥 Connection test crashed:'), error);
      }

      // Step 2: Test sync today
      console.log(chalk.yellow('\nStep 2: Testing Sync Today operation...'));
      try {
        const today = new Date().toISOString().split('T')[0];
        const syncResult = await tebraApi.syncSchedule({ date: today });
        
        if (flags.debug) {
          console.log(chalk.gray('Sync result:'), JSON.stringify(syncResult, null, 2));
        }
        
        if (syncResult && (syncResult as any).success) {
          console.log(chalk.green('✅ Sync Today operation successful'));
        } else {
          console.log(chalk.red('❌ Sync Today operation failed'));
          console.log(chalk.red(`Error: ${(syncResult as any)?.error}`));
        }
      } catch (error) {
        console.log(chalk.red('💥 Sync Today operation crashed:'), error);
      }

      // Step 3: Test health check
      console.log(chalk.yellow('\nStep 3: Testing health check...'));
      try {
        const healthResult = await tebraApi.healthCheck();
        
        if (flags.debug) {
          console.log(chalk.gray('Health result:'), JSON.stringify(healthResult, null, 2));
        }
        
        if (healthResult && (healthResult as any).success) {
          console.log(chalk.green('✅ Health check passed'));
        } else {
          console.log(chalk.red('❌ Health check failed'));
          console.log(chalk.red(`Error: ${(healthResult as any)?.error}`));
        }
      } catch (error) {
        console.log(chalk.red('💥 Health check crashed:'), error);
      }

    } catch (importError) {
      console.log(chalk.red('💥 Failed to import tebraApi:'), importError);
      console.log(chalk.yellow('\nThis might indicate a module resolution issue or missing dependencies.'));
    }

    console.log(chalk.cyan('\n📊 DIAGNOSIS COMPLETE'));
    console.log(chalk.gray('Check the results above to identify the failure point.'));
  }
}