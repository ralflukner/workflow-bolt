/**
 * Test Orchestrator - Core testing infrastructure
 * Coordinates complete end-to-end testing workflow
 */

import { existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { 
  TestConfig, 
  TestResult, 
  ImportMode, 
  PerformanceMetrics,
  TestLogger,
  LogEntry
} from '../../types/cli.js';
import { parseScheduleWithMegaParse } from '../../utils/megaParseSchedule.js';
import { parseScheduleAdvanced } from '../../utils/parseScheduleAdvanced.js';
import { parseSchedule } from '../../utils/parseSchedule.js';
import { BrowserController } from './BrowserController.js';
import { Patient } from '../../types/index.js';

export class TestOrchestrator {
  private logger: TestLogger;
  private browserController?: BrowserController;

  constructor() {
    this.logger = new CLILogger();
  }

  /**
   * Run complete import test workflow
   */
  async runImportTest(config: TestConfig): Promise<TestResult> {
    const startTime = Date.now();
    this.logger.info(`Starting import test with mode: ${config.mode}`, { config });

    // Initialize result object
    const result: TestResult = {
      success: false,
      testName: `Import Test - ${config.mode}`,
      mode: config.mode,
      importTime: 0,
      patientsImported: 0,
      patientsExpected: config.expectedPatients,
      dashboardVerified: false,
      errors: [],
      warnings: [],
      logs: [],
      timestamp: new Date().toISOString(),
      metadata: {
        scheduleFile: config.scheduleFile,
        format: config.format,
        browserUsed: config.verifyDashboard,
        performanceMetrics: {
          importStartTime: startTime,
          importEndTime: 0,
          importDuration: 0
        }
      }
    };

    try {
      // Step 1: Prepare test data
      const scheduleData = await this.prepareTestData(config);
      this.logger.info(`Loaded schedule data: ${scheduleData.length} characters`);

      // Step 2: Run schedule import
      const importResult = await this.runScheduleImport(scheduleData, config);
      result.patientsImported = importResult.patients.length;
      result.importTime = importResult.duration;
      result.metadata.performanceMetrics.importEndTime = Date.now();
      result.metadata.performanceMetrics.importDuration = importResult.duration;

      this.logger.info(`Import completed: ${result.patientsImported} patients imported`);

      // Step 3: Verify Dashboard (if requested)
      if (config.verifyDashboard) {
        const dashboardResult = await this.verifyDashboard(importResult.patients, config);
        result.dashboardVerified = dashboardResult.success;
        
        if (!dashboardResult.success) {
          result.errors.push(...dashboardResult.errors);
        }
      }

      // Step 4: Take screenshot (if requested)
      if (config.screenshotPath && this.browserController) {
        try {
          const screenshotPath = await this.browserController.takeScreenshot(config.screenshotPath);
          result.screenshotPath = screenshotPath;
          this.logger.info(`Screenshot saved: ${screenshotPath}`);
        } catch (error) {
          result.warnings.push(`Screenshot failed: ${error}`);
        }
      }

      // Step 5: Validate results
      result.success = this.validateTestResult(result, config);
      
      if (result.success) {
        this.logger.info('Import test completed successfully');
      } else {
        this.logger.error('Import test failed validation');
      }

    } catch (error) {
      this.logger.error('Import test failed with error', { error });
      result.errors.push(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Cleanup
      if (this.browserController) {
        await this.browserController.close();
      }
      
      // Collect logs
      result.logs = this.logger.getLogs().map(log => 
        `[${log.level.toUpperCase()}] ${log.timestamp} - ${log.message}`
      );
    }

    return result;
  }

  /**
   * Prepare test data from file or use built-in fixtures
   */
  private async prepareTestData(config: TestConfig): Promise<string> {
    if (config.scheduleFile) {
      // Load from specified file
      if (!existsSync(config.scheduleFile)) {
        throw new Error(`Schedule file not found: ${config.scheduleFile}`);
      }
      return readFileSync(config.scheduleFile, 'utf-8');
    }

    // Use built-in fixture based on format
    const fixturesDir = join(__dirname, '../fixtures');
    let fixtureFile: string;

    switch (config.format) {
      case 'lukner':
        fixtureFile = join(fixturesDir, 'lukner-sample.txt');
        break;
      case 'tsv':
        fixtureFile = join(fixturesDir, 'tsv-sample.txt');
        break;
      default:
        fixtureFile = join(fixturesDir, 'lukner-sample.txt');
    }

    if (!existsSync(fixtureFile)) {
      throw new Error(`Built-in fixture not found: ${fixtureFile}`);
    }

    return readFileSync(fixtureFile, 'utf-8');
  }

  /**
   * Run schedule import using specified mode
   */
  private async runScheduleImport(
    scheduleData: string, 
    config: TestConfig
  ): Promise<{ patients: Patient[]; duration: number }> {
    const startTime = Date.now();
    const testDate = new Date(2025, 6, 1); // July 1st, 2025
    
    let patients: Patient[] = [];

    this.logger.info(`Running ${config.mode} import`);

    try {
      switch (config.mode) {
        case 'megaparse':
          const megaParseResults = await parseScheduleWithMegaParse(scheduleData, testDate, {
            logFunction: (msg) => this.logger.debug(msg),
            securityAudit: false,
            defaultProvider: 'DR TEST PROVIDER'
          });
          patients = megaParseResults.map(p => ({ ...p, id: `mega-${Date.now()}-${Math.random()}` }));
          break;

        case 'secure':
          const secureResults = parseScheduleAdvanced(scheduleData, testDate, {
            logFunction: (msg) => this.logger.debug(msg),
            securityAudit: true,
            saveToSecureStorage: false
          });
          patients = secureResults.map(p => ({ ...p, id: `secure-${Date.now()}-${Math.random()}` }));
          break;

        case 'legacy':
          const legacyResults = parseSchedule(scheduleData, testDate);
          patients = legacyResults.map(p => ({ ...p, id: `legacy-${Date.now()}-${Math.random()}` }));
          break;

        default:
          throw new Error(`Unknown import mode: ${config.mode}`);
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Import completed in ${duration}ms, found ${patients.length} patients`);

      return { patients, duration };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Import failed after ${duration}ms`, { error });
      throw error;
    }
  }

  /**
   * Verify Dashboard state matches imported data
   */
  private async verifyDashboard(
    expectedPatients: Patient[], 
    config: TestConfig
  ): Promise<{ success: boolean; errors: string[] }> {
    this.logger.info('Starting Dashboard verification');

    if (!this.browserController) {
      this.browserController = new BrowserController();
      await this.browserController.launch({
        headless: true,
        viewport: { width: 1280, height: 720 },
        timeout: config.timeout,
        devtools: false
      });
    }

    try {
      // Navigate to application
      await this.browserController.navigateToApp('http://localhost:5173');
      
      // Simulate import in browser
      const importResult = await this.browserController.importSchedule(
        config.scheduleFile || 'built-in-fixture',
        config.mode
      );

      if (!importResult.success) {
        return { 
          success: false, 
          errors: [`Browser import failed: ${importResult.errors.join(', ')}`] 
        };
      }

      // Get Dashboard state
      const dashboardState = await this.browserController.getDashboardState();
      
      // Verify patient count
      const errors: string[] = [];
      
      if (dashboardState.patientsDisplayed !== expectedPatients.length) {
        errors.push(
          `Patient count mismatch: expected ${expectedPatients.length}, got ${dashboardState.patientsDisplayed}`
        );
      }

      // Verify specific patients are displayed
      for (const expectedPatient of expectedPatients) {
        const found = dashboardState.visiblePatients.find(
          p => p.name === expectedPatient.name
        );
        
        if (!found) {
          errors.push(`Patient not found in Dashboard: ${expectedPatient.name}`);
        } else if (found.status !== expectedPatient.status) {
          errors.push(
            `Patient status mismatch for ${expectedPatient.name}: expected ${expectedPatient.status}, got ${found.status}`
          );
        }
      }

      this.logger.info(`Dashboard verification completed with ${errors.length} errors`);
      return { success: errors.length === 0, errors };

    } catch (error) {
      this.logger.error('Dashboard verification failed', { error });
      return { 
        success: false, 
        errors: [`Dashboard verification error: ${error instanceof Error ? error.message : String(error)}`] 
      };
    }
  }

  /**
   * Validate test result against expectations
   */
  private validateTestResult(result: TestResult, config: TestConfig): boolean {
    const validations = [
      {
        check: result.patientsImported > 0,
        message: 'No patients were imported'
      },
      {
        check: config.expectedPatients === 0 || result.patientsImported === config.expectedPatients,
        message: `Expected ${config.expectedPatients} patients, but imported ${result.patientsImported}`
      },
      {
        check: result.importTime < config.timeout,
        message: `Import took ${result.importTime}ms, exceeding timeout of ${config.timeout}ms`
      },
      {
        check: !config.verifyDashboard || result.dashboardVerified,
        message: 'Dashboard verification was requested but failed'
      }
    ];

    for (const validation of validations) {
      if (!validation.check) {
        result.errors.push(validation.message);
      }
    }

    return result.errors.length === 0;
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(results: TestResult[], outputPath: string): Promise<string> {
    this.logger.info(`Generating test report: ${outputPath}`);

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    const report = {
      summary: this.generateReportSummary(results),
      results,
      generatedAt: new Date().toISOString(),
      metadata: {
        totalTests: results.length,
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    };

    // For now, generate JSON report (HTML generation would be added later)
    const reportJson = JSON.stringify(report, null, 2);
    require('fs').writeFileSync(outputPath, reportJson);

    this.logger.info(`Report generated successfully: ${outputPath}`);
    return outputPath;
  }

  /**
   * Generate summary statistics for test results
   */
  private generateReportSummary(results: TestResult[]) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalPatients = results.reduce((sum, r) => sum + r.patientsImported, 0);
    const totalImportTime = results.reduce((sum, r) => sum + r.importTime, 0);

    return {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      totalPatients,
      averageImportTime: totalTests > 0 ? totalImportTime / totalTests : 0,
      overallStatus: failedTests === 0 ? 'passed' : 'failed'
    };
  }
}

/**
 * Simple CLI Logger Implementation
 */
class CLILogger implements TestLogger {
  private logs: LogEntry[] = [];

  debug(message: string, metadata?: any): void {
    this.addLog('debug', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.addLog('info', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.addLog('warn', message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.addLog('error', message, metadata);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  private addLog(level: LogEntry['level'], message: string, metadata?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      component: 'TestOrchestrator',
      metadata
    };

    this.logs.push(entry);

    // Also log to console for real-time feedback
    const logMessage = `[${level.toUpperCase()}] ${message}`;
    switch (level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }
}