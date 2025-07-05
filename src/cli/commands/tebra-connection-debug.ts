import { Command, Flags } from '@oclif/core';
import tebraApi from '../../services/tebraFirebaseApi';
import chalk from 'chalk';

export default class TebraConnectionDebugCommand extends Command {
  static description = 'Test all aspects of Tebra API connectivity and integration';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --comprehensive',
    '<%= config.bin %> <%= command.id %> --test-endpoints',
    '<%= config.bin %> <%= command.id %> --debug',
  ];

  static flags = {
    comprehensive: Flags.boolean({
      description: 'Run comprehensive connectivity tests',
      default: false,
    }),
    'test-endpoints': Flags.boolean({
      description: 'Test all available Tebra API endpoints',
      default: false,
    }),
    'test-auth': Flags.boolean({
      description: 'Test authentication specifically',
      default: false,
    }),
    'test-data': Flags.boolean({
      description: 'Test data retrieval operations',
      default: false,
    }),
    timeout: Flags.integer({
      description: 'Timeout for each test in milliseconds',
      default: 30000,
    }),
    debug: Flags.boolean({
      description: 'Enable debug logging',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(TebraConnectionDebugCommand);

    console.log(chalk.blue.bold('🔌 TEBRA CONNECTION DIAGNOSTICS'));
    console.log(chalk.yellow('================================='));

    if (flags.debug) {
      console.log(chalk.gray(`Debug mode enabled, timeout: ${flags.timeout}ms`));
    }

    if (flags.comprehensive || (!flags['test-endpoints'] && !flags['test-auth'] && !flags['test-data'])) {
      await this.runComprehensiveTests(flags.debug, flags.timeout);
    }

    if (flags['test-endpoints']) {
      await this.testAllEndpoints(flags.debug, flags.timeout);
    }

    if (flags['test-auth']) {
      await this.testAuthentication(flags.debug, flags.timeout);
    }

    if (flags['test-data']) {
      await this.testDataRetrieval(flags.debug, flags.timeout);
    }
  }

  private async runComprehensiveTests(debug: boolean, timeout: number): Promise<void> {
    console.log(chalk.cyan('\n🔍 COMPREHENSIVE TEBRA CONNECTIVITY TEST'));
    console.log(chalk.gray('Running all connectivity tests with detailed analysis\n'));

    const testResults = {
      basicConnectivity: false,
      authentication: false,
      endpointAvailability: false,
      dataRetrieval: false,
      errorHandling: false,
      errors: [] as string[],
    };

    try {
      // Test 1: Basic Connectivity
      console.log(chalk.yellow('Test 1: Basic Connectivity...'));
      const connectivityResult = await this.testBasicConnectivity(debug, timeout);
      testResults.basicConnectivity = connectivityResult.success;
      if (!connectivityResult.success) {
        testResults.errors.push(`Basic connectivity: ${connectivityResult.error}`);
      }

      // Test 2: Authentication
      console.log(chalk.yellow('Test 2: Authentication...'));
      const authResult = await this.testAuthenticationInternal(debug, timeout);
      testResults.authentication = authResult.success;
      if (!authResult.success) {
        testResults.errors.push(`Authentication: ${authResult.error}`);
      }

      // Test 3: Endpoint Availability
      console.log(chalk.yellow('Test 3: Endpoint Availability...'));
      const endpointResult = await this.testEndpointAvailability(debug, timeout);
      testResults.endpointAvailability = endpointResult.success;
      if (!endpointResult.success) {
        testResults.errors.push(`Endpoint availability: ${endpointResult.error}`);
      }

      // Test 4: Data Retrieval
      console.log(chalk.yellow('Test 4: Data Retrieval...'));
      const dataResult = await this.testDataRetrievalInternal(debug, timeout);
      testResults.dataRetrieval = dataResult.success;
      if (!dataResult.success) {
        testResults.errors.push(`Data retrieval: ${dataResult.error}`);
      }

      // Test 5: Error Handling
      console.log(chalk.yellow('Test 5: Error Handling...'));
      const errorResult = await this.testErrorHandling(debug, timeout);
      testResults.errorHandling = errorResult.success;
      if (!errorResult.success) {
        testResults.errors.push(`Error handling: ${errorResult.error}`);
      }

      // Print summary
      this.printTestSummary(testResults);

    } catch (error) {
      console.error(chalk.red('Fatal error during comprehensive tests:'), error);
      testResults.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testBasicConnectivity(debug: boolean, timeout: number): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        tebraApi.testConnection(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]) as ApiResponse;
      const duration = Date.now() - startTime;

      if (debug) {
        console.log(chalk.gray(`  Connection test completed in ${duration}ms`));
        console.log(chalk.gray('  Result:'), JSON.stringify(result, null, 2));
      }

      if (result && typeof result === 'object' && 'success' in result) {
        return {
          success: result.success,
          error: result.error,
          data: { ...result.data, duration },
        };
      } else {
        return {
          success: false,
          error: 'Invalid response format',
          data: { duration },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (debug) {
        console.log(chalk.red('  Connection test failed:'), errorMessage);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async testAuthenticationInternal(debug: boolean, timeout: number): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        tebraApi.healthCheck(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]) as ApiResponse;
      const duration = Date.now() - startTime;

      if (debug) {
        console.log(chalk.gray(`  Authentication test completed in ${duration}ms`));
        console.log(chalk.gray('  Result:'), JSON.stringify(result, null, 2));
      }

      if (result && typeof result === 'object' && 'success' in result) {
        return {
          success: result.success,
          error: result.error,
          data: { ...result.data, duration },
        };
      } else {
        return {
          success: false,
          error: 'Invalid response format',
          data: { duration },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (debug) {
        console.log(chalk.red('  Authentication test failed:'), errorMessage);
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async testEndpointAvailability(debug: boolean, timeout: number): Promise<{ success: boolean; error?: string; data?: any }> {
    const endpoints = [
      { name: 'Health Check', test: () => tebraApi.healthCheck() },
      { name: 'Test Connection', test: () => tebraApi.testConnection() },
      { name: 'Get Providers', test: () => tebraApi.getProviders() },
    ];

    const results = [];
    let allSuccessful = true;

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          endpoint.test(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]) as ApiResponse;
        const duration = Date.now() - startTime;

        const success = result && typeof result === 'object' && 'success' in result && result.success;
        results.push({
          name: endpoint.name,
          success,
          duration,
          error: success ? undefined : (result as any)?.error || 'Unknown error',
        });

        if (!success) {
          allSuccessful = false;
        }

        if (debug) {
          const status = success ? chalk.green('✅') : chalk.red('❌');
          console.log(chalk.gray(`  ${status} ${endpoint.name}: ${duration}ms`));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          name: endpoint.name,
          success: false,
          error: errorMessage,
        });
        allSuccessful = false;

        if (debug) {
          console.log(chalk.red(`  ❌ ${endpoint.name}: ${errorMessage}`));
        }
      }
    }

    return {
      success: allSuccessful,
      error: allSuccessful ? undefined : `${results.filter(r => !r.success).length} endpoints failed`,
      data: results,
    };
  }

  private async testDataRetrievalInternal(debug: boolean, timeout: number): Promise<{ success: boolean; error?: string; data?: any }> {
    const dataTests = [
      { 
        name: 'Get Providers', 
        test: () => tebraApi.getProviders() 
      },
      { 
        name: 'Get Appointments (Today)', 
        test: () => {
          const today = new Date().toISOString().split('T')[0];
          return tebraApi.getAppointments({ fromDate: today, toDate: today });
        }
      },
    ];

    const results = [];
    let allSuccessful = true;

    for (const dataTest of dataTests) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          dataTest.test(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]) as ApiResponse;
        const duration = Date.now() - startTime;

        const success = result && typeof result === 'object' && 'success' in result && result.success;
        const hasData = success && result.data;
        
        results.push({
          name: dataTest.name,
          success,
          hasData,
          duration,
          dataType: hasData ? typeof result.data : 'none',
          error: success ? undefined : (result as any)?.error || 'Unknown error',
        });

        if (!success) {
          allSuccessful = false;
        }

        if (debug) {
          const status = success ? chalk.green('✅') : chalk.red('❌');
          const dataInfo = hasData ? chalk.blue(`[${typeof result.data}]`) : chalk.gray('[no data]');
          console.log(chalk.gray(`  ${status} ${dataTest.name}: ${duration}ms ${dataInfo}`));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          name: dataTest.name,
          success: false,
          error: errorMessage,
        });
        allSuccessful = false;

        if (debug) {
          console.log(chalk.red(`  ❌ ${dataTest.name}: ${errorMessage}`));
        }
      }
    }

    return {
      success: allSuccessful,
      error: allSuccessful ? undefined : `${results.filter(r => !r.success).length} data tests failed`,
      data: results,
    };
  }

  private async testErrorHandling(debug: boolean, timeout: number): Promise<{ success: boolean; error?: string; data?: any }> {
    // Test error handling by making requests that should fail gracefully
    const errorTests = [
      {
        name: 'Invalid Date Range',
        test: () => tebraApi.getAppointments({ fromDate: 'invalid-date', toDate: 'invalid-date' }),
      },
      {
        name: 'Empty Parameters',
        test: () => tebraApi.getAppointments({ fromDate: '', toDate: '' }),
      },
    ];

    const results = [];
    let allHandledGracefully = true;

    for (const errorTest of errorTests) {
      try {
        const startTime = Date.now();
        const result = await Promise.race([
          errorTest.test(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]) as ApiResponse;
        const duration = Date.now() - startTime;

        // For error tests, we expect them to fail but handle errors gracefully
        const handledGracefully = result && typeof result === 'object' && 'success' in result && !result.success && result.error;
        
        results.push({
          name: errorTest.name,
          handledGracefully,
          duration,
          error: handledGracefully ? undefined : 'Did not handle error gracefully',
        });

        if (!handledGracefully) {
          allHandledGracefully = false;
        }

        if (debug) {
          const status = handledGracefully ? chalk.green('✅') : chalk.red('❌');
          console.log(chalk.gray(`  ${status} ${errorTest.name}: ${duration}ms`));
        }
      } catch (error) {
        // Catching an exception is actually bad for error handling tests
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          name: errorTest.name,
          handledGracefully: false,
          error: `Threw exception: ${errorMessage}`,
        });
        allHandledGracefully = false;

        if (debug) {
          console.log(chalk.red(`  ❌ ${errorTest.name}: Threw exception - ${errorMessage}`));
        }
      }
    }

    return {
      success: allHandledGracefully,
      error: allHandledGracefully ? undefined : `${results.filter(r => !r.handledGracefully).length} error tests failed`,
      data: results,
    };
  }

  private async testAllEndpoints(debug: boolean, timeout: number): Promise<void> {
    console.log(chalk.cyan('\n🌐 TESTING ALL TEBRA ENDPOINTS'));
    console.log(chalk.gray('Testing each available Tebra API endpoint\n'));

    const endpoints = [
      { name: 'Health Check', fn: 'tebraHealthCheck', test: () => tebraApi.healthCheck() },
      { name: 'Test Connection', fn: 'tebraTestConnection', test: () => tebraApi.testConnection() },
      { name: 'Get Providers', fn: 'tebraGetProviders', test: () => tebraApi.getProviders() },
      { name: 'Get Patients', fn: 'tebraGetPatients', test: () => tebraApi.getPatients() },
      { 
        name: 'Get Appointments', 
        fn: 'tebraGetAppointments', 
        test: () => {
          const today = new Date().toISOString().split('T')[0];
          return tebraApi.getAppointments({ fromDate: today, toDate: today });
        }
      },
      { 
        name: 'Sync Schedule', 
        fn: 'tebraSyncSchedule', 
        test: () => {
          const today = new Date().toISOString().split('T')[0];
          return tebraApi.syncSchedule({ date: today });
        }
      },
    ];

    for (const endpoint of endpoints) {
      await this.testSingleEndpoint(endpoint, debug, timeout);
      // Add delay between tests to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async testSingleEndpoint(endpoint: any, debug: boolean, timeout: number): Promise<void> {
    console.log(chalk.yellow(`Testing ${endpoint.name}...`));
    
    try {
      const startTime = Date.now();
      const result = await Promise.race([
        endpoint.test(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]) as ApiResponse;
      const duration = Date.now() - startTime;

      const success = result && typeof result === 'object' && 'success' in result && result.success;
      
      if (success) {
        console.log(chalk.green(`✅ ${endpoint.name} - SUCCESS (${duration}ms)`));
        if (debug && result.data) {
          console.log(chalk.gray('  Data preview:'), JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
        }
      } else {
        console.log(chalk.red(`❌ ${endpoint.name} - FAILED (${duration}ms)`));
        console.log(chalk.red(`  Error: ${(result as any)?.error || 'Unknown error'}`));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(chalk.red(`💥 ${endpoint.name} - CRASHED`));
      console.log(chalk.red(`  Exception: ${errorMessage}`));
    }
  }

  private async testAuthentication(debug: boolean, timeout: number): Promise<void> {
    console.log(chalk.cyan('\n🔐 TESTING AUTHENTICATION'));
    console.log(chalk.gray('Testing Tebra authentication mechanisms\n'));

    await this.testAuthenticationInternal(debug, timeout);
  }

  private async testDataRetrieval(debug: boolean, timeout: number): Promise<void> {
    console.log(chalk.cyan('\n📊 TESTING DATA RETRIEVAL'));
    console.log(chalk.gray('Testing data retrieval operations\n'));

    await this.testDataRetrievalInternal(debug, timeout);
  }

  private printTestSummary(results: any): void {
    console.log(chalk.cyan('\n📋 TEST SUMMARY'));
    console.log(chalk.gray('================'));
    
    const tests = [
      { name: 'Basic Connectivity', result: results.basicConnectivity },
      { name: 'Authentication', result: results.authentication },
      { name: 'Endpoint Availability', result: results.endpointAvailability },
      { name: 'Data Retrieval', result: results.dataRetrieval },
      { name: 'Error Handling', result: results.errorHandling },
    ];
    
    tests.forEach(test => {
      const status = test.result ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${status} ${test.name}`);
    });
    
    if (results.errors.length > 0) {
      console.log(chalk.red('\n🚨 DETAILED ERRORS:'));
      results.errors.forEach((error: string, index: number) => {
        console.log(chalk.red(`${index + 1}. ${error}`));
      });
    }
    
    const successCount = tests.filter(t => t.result).length;
    const totalCount = tests.length;
    const successRate = Math.round(successCount/totalCount*100);
    
    if (successRate === 100) {
      console.log(chalk.green(`\n🎉 ALL TESTS PASSED: ${successCount}/${totalCount} (${successRate}%)`));
    } else if (successRate >= 80) {
      console.log(chalk.yellow(`\n⚠️  MOST TESTS PASSED: ${successCount}/${totalCount} (${successRate}%)`));
    } else {
      console.log(chalk.red(`\n🚨 MULTIPLE FAILURES: ${successCount}/${totalCount} (${successRate}%)`));
    }
  }
}