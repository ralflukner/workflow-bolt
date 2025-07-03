/**
 * CLI Type Definitions for workflow-test
 * Comprehensive types for integration testing infrastructure
 */

import { Patient } from './index';

// ============================================================================
// Core Test Configuration Types
// ============================================================================

export type ImportMode = 'megaparse' | 'secure' | 'legacy';
export type ScheduleFormat = 'lukner' | 'tsv' | 'auto';
export type ReportFormat = 'html' | 'json' | 'markdown';

export interface TestConfig {
  mode: ImportMode;
  scheduleFile?: string;
  format: ScheduleFormat;
  expectedPatients: number;
  timeout: number;
  screenshotPath?: string;
  outputDir: string;
  verifyDashboard: boolean;
}

export interface TestResult {
  success: boolean;
  testName: string;
  mode: ImportMode;
  importTime: number;
  patientsImported: number;
  patientsExpected: number;
  dashboardVerified: boolean;
  screenshotPath?: string;
  errors: string[];
  warnings: string[];
  logs: string[];
  timestamp: string;
  metadata: {
    scheduleFile?: string;
    format: ScheduleFormat;
    browserUsed: boolean;
    performanceMetrics: PerformanceMetrics;
  };
}

export interface PerformanceMetrics {
  importStartTime: number;
  importEndTime: number;
  importDuration: number;
  dashboardRenderTime?: number;
  screenshotTime?: number;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

// ============================================================================
// Browser Automation Types
// ============================================================================

export interface BrowserConfig {
  headless: boolean;
  viewport: {
    width: number;
    height: number;
  };
  timeout: number;
  devtools: boolean;
  slowMo?: number;
}

export interface BrowserController {
  launch(config: BrowserConfig): Promise<void>;
  navigateToApp(url?: string): Promise<void>;
  importSchedule(file: string, mode: ImportMode): Promise<ImportResult>;
  getDashboardState(): Promise<DashboardState>;
  takeScreenshot(path: string, options?: ScreenshotOptions): Promise<string>;
  waitForElement(selector: string, timeout?: number): Promise<void>;
  clickElement(selector: string): Promise<void>;
  typeText(selector: string, text: string): Promise<void>;
  close(): Promise<void>;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImportResult {
  success: boolean;
  patientsImported: number;
  importTime: number;
  errors: string[];
  logs: string[];
}

// ============================================================================
// Dashboard Verification Types
// ============================================================================

export interface DashboardState {
  patientsDisplayed: number;
  currentProvider: string;
  scheduleDate: string;
  visiblePatients: PatientSummary[];
  uiElements: UIElementState[];
  loadingState: boolean;
  errorState?: string;
  metadata: {
    timestamp: string;
    url: string;
    viewportSize: { width: number; height: number };
  };
}

export interface PatientSummary {
  name: string;
  status: string;
  appointmentTime: string;
  provider: string;
  visible: boolean;
  elementSelector: string;
}

export interface UIElementState {
  selector: string;
  visible: boolean;
  text?: string;
  count?: number;
  attributes?: Record<string, string>;
}

export interface ExpectedDashboardState {
  patients: number;
  provider?: string;
  date?: string;
  specificPatients?: ExpectedPatient[];
  uiElements?: ExpectedUIElement[];
}

export interface ExpectedPatient {
  name: string;
  status?: string;
  appointmentTime?: string;
  mustBeVisible: boolean;
}

export interface ExpectedUIElement {
  selector: string;
  shouldBeVisible: boolean;
  expectedText?: string;
  expectedCount?: number;
}

export interface VerificationResult {
  success: boolean;
  passed: VerificationCheck[];
  failed: VerificationCheck[];
  warnings: VerificationCheck[];
  summary: string;
  details: VerificationDetails;
}

export interface VerificationCheck {
  name: string;
  type: 'patient_count' | 'patient_data' | 'ui_element' | 'performance' | 'state';
  expected: any;
  actual: any;
  passed: boolean;
  message: string;
}

export interface VerificationDetails {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  checkDuration: number;
  screenshotTaken: boolean;
}

// ============================================================================
// Data Validation Types
// ============================================================================

export interface ValidationRule {
  field: keyof Patient;
  required: boolean;
  validator: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  value: any;
  message: string;
  suggestion?: string;
}

export interface ValidationSummary {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  warningRecords: number;
  validationTime: number;
}

export interface PatientExpectation {
  name: string;
  status?: string;
  dob?: string;
  provider?: string;
  appointmentTime?: string;
  mustExist: boolean;
  exactMatch?: boolean;
}

// ============================================================================
// Test Data Management Types
// ============================================================================

export interface TestDataSet {
  name: string;
  description: string;
  format: ScheduleFormat;
  filePath: string;
  expectedResults: TestDataExpectation;
  metadata: {
    source: string;
    created: string;
    lastModified: string;
    size: number;
    checksum: string;
  };
}

export interface TestDataExpectation {
  expectedPatients: number;
  expectedProvider: string;
  expectedDate: string;
  patients: PatientExpectation[];
  notes?: string;
}

export interface GenerateDataOptions {
  format: ScheduleFormat;
  patientCount: number;
  scheduleDate: string;
  provider: string;
  outputFile: string;
  includeVariations: boolean;
  seed?: number;
}

// ============================================================================
// Report Generation Types
// ============================================================================

export interface TestReport {
  summary: TestReportSummary;
  results: TestResult[];
  comparisons: TestComparison[];
  recommendations: string[];
  metadata: ReportMetadata;
}

export interface TestReportSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalPatients: number;
  totalImportTime: number;
  averageImportTime: number;
  successRate: number;
  overallStatus: 'passed' | 'failed' | 'warning';
}

export interface TestComparison {
  testName: string;
  modes: {
    [key in ImportMode]?: {
      success: boolean;
      patientsImported: number;
      importTime: number;
      errors: number;
    };
  };
  winner: ImportMode | 'tie';
  notes: string[];
}

export interface ReportMetadata {
  generatedAt: string;
  generatedBy: string;
  version: string;
  environment: {
    nodeVersion: string;
    platform: string;
    hostname: string;
  };
  testDuration: number;
  screenshotCount: number;
  outputDirectory: string;
}

export interface ReportOptions {
  format: ReportFormat;
  outputPath: string;
  includeScreenshots: boolean;
  openInBrowser: boolean;
  compareWith?: string;
  template?: string;
}

// ============================================================================
// CLI Command Types
// ============================================================================

export interface ImportCommandFlags {
  mode: ImportMode;
  format: ScheduleFormat;
  output: string;
  screenshot: boolean;
  'verify-count': number;
  timeout: number;
  headless: boolean;
  verbose: boolean;
}

export interface VerifyCommandFlags {
  patients: number;
  provider?: string;
  date?: string;
  screenshot: boolean;
  output: string;
  timeout: number;
  verbose: boolean;
}

export interface TestSuiteCommandFlags {
  modes: string;
  'data-sets'?: string;
  output: string;
  parallel: boolean;
  cleanup: boolean;
  timeout: number;
  screenshot: boolean;
  verbose: boolean;
  'fail-fast': boolean;
  baseline?: string;
}

export interface GenerateDataCommandFlags {
  format: ScheduleFormat;
  patients: number;
  date: string;
  provider: string;
  output: string;
  variations: boolean;
  seed?: number;
}

export interface ReportCommandFlags {
  format: ReportFormat;
  open: boolean;
  compare?: string;
  template?: string;
  output?: string;
}

// ============================================================================
// Error and Logging Types
// ============================================================================

export interface CLIError {
  code: string;
  message: string;
  details?: any;
  suggestions?: string[];
  recoverable: boolean;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  component: string;
  metadata?: any;
}

export interface TestLogger {
  debug(message: string, metadata?: any): void;
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  getLogs(): LogEntry[];
  clearLogs(): void;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface CLIConfig {
  defaultTimeout: number;
  defaultOutputDir: string;
  defaultBrowserConfig: BrowserConfig;
  appUrl: string;
  testDataDirectory: string;
  screenshotDirectory: string;
  reportTemplateDirectory: string;
  maxRetries: number;
  retryDelay: number;
}

export interface UserPreferences {
  defaultMode: ImportMode;
  defaultFormat: ScheduleFormat;
  defaultReportFormat: ReportFormat;
  alwaysTakeScreenshots: boolean;
  verboseLogging: boolean;
  cleanupAfterTests: boolean;
  parallelExecution: boolean;
}