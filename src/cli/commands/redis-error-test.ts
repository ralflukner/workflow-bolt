import { Command, Flags } from '@oclif/core';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

export default class RedisErrorTestCommand extends Command {
  static description = 'Test Redis JSON error handling and recovery mechanisms';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --test-module-missing',
    '<%= config.bin %> <%= command.id %> --test-connection-errors',
    '<%= config.bin %> <%= command.id %> --comprehensive',
  ];

  static flags = {
    'test-module-missing': Flags.boolean({
      description: 'Test RedisJSON module missing scenarios',
      default: false,
    }),
    'test-connection-errors': Flags.boolean({
      description: 'Test Redis connection error handling',
      default: false,
    }),
    'test-serialization': Flags.boolean({
      description: 'Test JSON serialization error handling',
      default: false,
    }),
    'comprehensive': Flags.boolean({
      description: 'Run all Redis error handling tests',
      default: false,
    }),
    'debug': Flags.boolean({
      description: 'Enable debug logging',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RedisErrorTestCommand);

    console.log(chalk.blue.bold('🔧 REDIS ERROR HANDLING TESTS'));
    console.log(chalk.yellow('================================='));

    if (flags.debug) {
      console.log(chalk.gray('Debug mode enabled - verbose output'));
    }

    const testResults = {
      moduleTests: false,
      connectionTests: false,
      serializationTests: false,
      integrationTests: false,
      errors: [] as string[],
    };

    try {
      if (flags.comprehensive || flags['test-module-missing']) {
        console.log(chalk.cyan('\n🔍 Testing RedisJSON Module Missing Scenarios...'));
        testResults.moduleTests = await this.testRedisJSONModuleMissing(flags.debug);
      }

      if (flags.comprehensive || flags['test-connection-errors']) {
        console.log(chalk.cyan('\n🔗 Testing Redis Connection Error Handling...'));
        testResults.connectionTests = await this.testConnectionErrors(flags.debug);
      }

      if (flags.comprehensive || flags['test-serialization']) {
        console.log(chalk.cyan('\n📄 Testing JSON Serialization Error Handling...'));
        testResults.serializationTests = await this.testSerializationErrors(flags.debug);
      }

      if (flags.comprehensive) {
        console.log(chalk.cyan('\n🧪 Running Integration Tests...'));
        testResults.integrationTests = await this.runIntegrationTests(flags.debug);
      }

      this.printTestSummary(testResults);

    } catch (error) {
      console.error(chalk.red('Fatal error during Redis error testing:'), error);
      testResults.errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testRedisJSONModuleMissing(debug: boolean): Promise<boolean> {
    try {
      console.log(chalk.yellow('  Testing behavior when RedisJSON module is not available...'));

      // Create a test script that simulates missing RedisJSON
      const testScript = `
import sys
import os
from unittest.mock import Mock, patch
import redis

# Add path to import the client
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'ai-agents', 'luknerlumina'))

try:
    from secure_redis_client import LuknerSecureRedisClient
    
    # Create client and mock Redis
    client = LuknerSecureRedisClient()
    mock_redis = Mock()
    client.client = mock_redis
    
    # Simulate RedisJSON command not available
    mock_redis.json.return_value.set.side_effect = redis.exceptions.ResponseError("ERR unknown command 'JSON.SET'")
    
    # Test patient data storage
    try:
        client.store_patient_data("test123", {"name": "Test Patient"})
        print("❌ Expected RuntimeError but operation succeeded")
        exit(1)
    except RuntimeError as e:
        if "RedisJSON module is not available" in str(e):
            print("✅ Correctly caught RedisJSON module missing error")
            exit(0)
        else:
            print(f"❌ Unexpected error message: {e}")
            exit(1)
    except Exception as e:
        print(f"❌ Unexpected exception type: {type(e).__name__}: {e}")
        exit(1)
        
except ImportError as e:
    print(f"❌ Failed to import secure_redis_client: {e}")
    exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    exit(1)
`;

      const result = await this.runPythonScript(testScript, debug);
      
      if (result.success) {
        console.log(chalk.green('  ✅ RedisJSON module missing handling works correctly'));
        return true;
      } else {
        console.log(chalk.red('  ❌ RedisJSON module missing handling failed'));
        if (debug) {
          console.log(chalk.gray('  Error output:'), result.output);
        }
        return false;
      }

    } catch (error) {
      console.log(chalk.red('  💥 RedisJSON module test crashed:'), error);
      return false;
    }
  }

  private async testConnectionErrors(debug: boolean): Promise<boolean> {
    try {
      console.log(chalk.yellow('  Testing Redis connection error handling...'));

      const testScript = `
import sys
import os
from unittest.mock import Mock
import redis

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'ai-agents', 'luknerlumina'))

try:
    from secure_redis_client import LuknerSecureRedisClient
    
    client = LuknerSecureRedisClient()
    mock_redis = Mock()
    client.client = mock_redis
    
    # Simulate connection error
    mock_redis.json.return_value.set.side_effect = redis.exceptions.ConnectionError("Connection refused")
    
    try:
        client.store_patient_data("test123", {"name": "Test Patient"})
        print("❌ Expected ConnectionError but operation succeeded")
        exit(1)
    except ConnectionError as e:
        if "Failed to connect to Redis" in str(e):
            print("✅ Correctly caught Redis connection error")
            exit(0)
        else:
            print(f"❌ Unexpected error message: {e}")
            exit(1)
    except Exception as e:
        print(f"❌ Unexpected exception type: {type(e).__name__}: {e}")
        exit(1)
        
except Exception as e:
    print(f"❌ Test setup failed: {e}")
    exit(1)
`;

      const result = await this.runPythonScript(testScript, debug);
      
      if (result.success) {
        console.log(chalk.green('  ✅ Connection error handling works correctly'));
        return true;
      } else {
        console.log(chalk.red('  ❌ Connection error handling failed'));
        if (debug) {
          console.log(chalk.gray('  Error output:'), result.output);
        }
        return false;
      }

    } catch (error) {
      console.log(chalk.red('  💥 Connection error test crashed:'), error);
      return false;
    }
  }

  private async testSerializationErrors(debug: boolean): Promise<boolean> {
    try {
      console.log(chalk.yellow('  Testing JSON serialization error handling...'));

      const testScript = `
import sys
import os
from unittest.mock import Mock

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'ai-agents', 'luknerlumina'))

try:
    from secure_redis_client import LuknerSecureRedisClient
    
    client = LuknerSecureRedisClient()
    mock_redis = Mock()
    client.client = mock_redis
    
    # Simulate serialization error
    mock_redis.json.return_value.set.side_effect = TypeError("Object of type dict is not JSON serializable")
    
    try:
        client.store_patient_data("test123", {"name": "Test Patient"})
        print("❌ Expected ValueError but operation succeeded")
        exit(1)
    except ValueError as e:
        if "Invalid data format" in str(e):
            print("✅ Correctly caught JSON serialization error")
            exit(0)
        else:
            print(f"❌ Unexpected error message: {e}")
            exit(1)
    except Exception as e:
        print(f"❌ Unexpected exception type: {type(e).__name__}: {e}")
        exit(1)
        
except Exception as e:
    print(f"❌ Test setup failed: {e}")
    exit(1)
`;

      const result = await this.runPythonScript(testScript, debug);
      
      if (result.success) {
        console.log(chalk.green('  ✅ Serialization error handling works correctly'));
        return true;
      } else {
        console.log(chalk.red('  ❌ Serialization error handling failed'));
        if (debug) {
          console.log(chalk.gray('  Error output:'), result.output);
        }
        return false;
      }

    } catch (error) {
      console.log(chalk.red('  💥 Serialization error test crashed:'), error);
      return false;
    }
  }

  private async runIntegrationTests(debug: boolean): Promise<boolean> {
    try {
      console.log(chalk.yellow('  Running comprehensive integration tests...'));

      const testScript = `
import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'ai-agents', 'luknerlumina'))

try:
    # Run the unit tests
    from tests.test_secure_redis_client import TestLuknerSecureRedisClient, TestRedisJSONErrorRecovery
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestLuknerSecureRedisClient)
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestRedisJSONErrorRecovery))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)
    
    if result.wasSuccessful():
        print("✅ All integration tests passed")
        exit(0)
    else:
        print(f"❌ {len(result.failures)} failures, {len(result.errors)} errors")
        for test, traceback in result.failures + result.errors:
            print(f"FAILED: {test}")
            if "${debug}" == "True":
                print(traceback)
        exit(1)
        
except Exception as e:
    print(f"❌ Integration test setup failed: {e}")
    exit(1)
`;

      const result = await this.runPythonScript(testScript, debug);
      
      if (result.success) {
        console.log(chalk.green('  ✅ Integration tests passed'));
        return true;
      } else {
        console.log(chalk.red('  ❌ Integration tests failed'));
        if (debug) {
          console.log(chalk.gray('  Test output:'), result.output);
        }
        return false;
      }

    } catch (error) {
      console.log(chalk.red('  💥 Integration tests crashed:'), error);
      return false;
    }
  }

  private async runPythonScript(script: string, debug: boolean): Promise<{ success: boolean; output: string }> {
    return new Promise((resolve) => {
      const python = spawn('python3', ['-c', script], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (debug) {
          console.log(chalk.gray('    Python stdout:'), text.trim());
        }
      });

      python.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (debug) {
          console.log(chalk.gray('    Python stderr:'), text.trim());
        }
      });

      python.on('close', (code) => {
        const success = code === 0;
        const allOutput = output + (errorOutput ? '\nSTDERR:\n' + errorOutput : '');
        
        if (debug) {
          console.log(chalk.gray(`    Python process exited with code: ${code}`));
        }
        
        resolve({
          success,
          output: allOutput.trim(),
        });
      });

      python.on('error', (error) => {
        if (debug) {
          console.log(chalk.red('    Python process error:'), error);
        }
        resolve({
          success: false,
          output: `Process error: ${error.message}`,
        });
      });
    });
  }

  private printTestSummary(results: any): void {
    console.log(chalk.cyan('\n📊 REDIS ERROR HANDLING TEST SUMMARY'));
    console.log(chalk.gray('====================================='));
    
    const tests = [
      { name: 'RedisJSON Module Missing', result: results.moduleTests },
      { name: 'Connection Error Handling', result: results.connectionTests },
      { name: 'Serialization Error Handling', result: results.serializationTests },
      { name: 'Integration Tests', result: results.integrationTests },
    ];
    
    tests.forEach(test => {
      if (test.result !== false) {  // Only show tests that were actually run
        const status = test.result ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
        console.log(`${status} ${test.name}`);
      }
    });
    
    if (results.errors.length > 0) {
      console.log(chalk.red('\n🚨 ERRORS ENCOUNTERED:'));
      results.errors.forEach((error: string, index: number) => {
        console.log(chalk.red(`${index + 1}. ${error}`));
      });
    }
    
    const runTests = tests.filter(t => t.result !== false);
    const successCount = runTests.filter(t => t.result === true).length;
    const totalCount = runTests.length;
    
    if (totalCount === 0) {
      console.log(chalk.yellow('\n⚠️  No tests were run. Use flags to specify which tests to execute.'));
    } else {
      const successRate = Math.round(successCount/totalCount*100);
      
      if (successRate === 100) {
        console.log(chalk.green(`\n🎉 ALL TESTS PASSED: ${successCount}/${totalCount} (${successRate}%)`));
      } else if (successRate >= 80) {
        console.log(chalk.yellow(`\n⚠️  MOSTLY PASSED: ${successCount}/${totalCount} (${successRate}%)`));
      } else {
        console.log(chalk.red(`\n🚨 MULTIPLE FAILURES: ${successCount}/${totalCount} (${successRate}%)`));
      }
    }
  }
}