# CLI Integration Testing Design with oclif

**Version**: 1.0  
**Date**: 2025-07-01  
**Purpose**: Complete integration testing of schedule import workflow

## Overview

This document outlines the design for a comprehensive CLI-based integration testing system using oclif (Open CLI Framework) to test the complete workflow from schedule import to Dashboard display verification.

## Architecture

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   oclif CLI     │───▶│  Test Orchestrator│───▶│   Dashboard     │
│   Commands      │    │                  │    │   Verification  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Schedule Import │    │  Data Validation │    │  UI State Check │
│   Simulation    │    │   & Tracking     │    │  & Screenshots  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Design Principles

### 1. Complete End-to-End Testing

- **Input**: Real Lukner Medical Clinic schedule data
- **Process**: Full import workflow (MegaParse → Context → Dashboard)  
- **Output**: Visual verification of patient data in Dashboard

### 2. Multi-Mode Testing

- **MegaParse Mode**: Test AI-powered parsing
- **Secure Mode**: Test HIPAA-compliant parsing
- **Legacy Mode**: Test legacy parser (for comparison)

### 3. Automated Verification

- **Data Integrity**: Verify all imported patients appear correctly
- **UI State**: Check Dashboard component rendering
- **Performance**: Measure import and rendering times

### 4. Comprehensive Reporting

- **Test Results**: Pass/fail status with detailed logs
- **Screenshots**: Visual proof of Dashboard state
- **Performance Metrics**: Import times, patient counts, error rates

## CLI Command Structure

### Base Command: `workflow-test`

```bash
workflow-test <command> [options]
```

### Primary Commands

#### 1. `import` - Schedule Import Testing

```bash
workflow-test import [file] [options]

Options:
  --mode=<mode>           Import mode: megaparse|secure|legacy (default: megaparse)
  --format=<format>       Schedule format: lukner|tsv|auto (default: auto)
  --output=<path>         Output directory for test results
  --screenshot           Take screenshot of Dashboard after import
  --verify-count=<num>    Expected number of patients to import
  --timeout=<ms>          Timeout for import operation (default: 30000)
```

**Purpose**: Test complete schedule import workflow from file to Dashboard display

**Workflow**:

1. Load schedule file (or use built-in test data)
2. Execute import using specified mode
3. Verify patient data in context
4. Check Dashboard rendering
5. Generate test report with screenshots

#### 2. `verify` - Dashboard State Verification

```bash
workflow-test verify [options]

Options:
  --patients=<count>      Expected number of patients
  --provider=<name>       Expected provider name
  --date=<date>          Expected schedule date
  --screenshot           Take verification screenshot
  --output=<path>        Output directory for verification results
```

**Purpose**: Verify current Dashboard state matches expected data

**Workflow**:

1. Query current application state
2. Check patient context data
3. Verify Dashboard component rendering
4. Compare against expected values
5. Generate verification report

#### 3. `test-suite` - Complete Integration Test Suite

```bash
workflow-test test-suite [options]

Options:
  --modes=<modes>         Comma-separated list of modes to test (default: all)
  --data-sets=<paths>     Comma-separated list of test data files
  --output=<path>         Output directory for all test results
  --parallel             Run tests in parallel
  --cleanup              Clean up test data after completion
```

**Purpose**: Run comprehensive test suite across all modes and data sets

**Workflow**:

1. Run import tests for each mode
2. Verify Dashboard state after each import
3. Compare results across modes
4. Generate comprehensive test report
5. Clean up test data (if requested)

#### 4. `generate-data` - Test Data Generation

```bash
workflow-test generate-data [options]

Options:
  --format=<format>       Output format: lukner|tsv|json
  --patients=<count>      Number of patients to generate (default: 5)
  --date=<date>          Schedule date (default: today)
  --provider=<name>       Provider name (default: RALF LUKNER)
  --output=<file>         Output file path
```

**Purpose**: Generate test schedule data for testing purposes

#### 5. `report` - Test Results Analysis

```bash
workflow-test report [path] [options]

Options:
  --format=<format>       Report format: html|json|markdown (default: html)
  --open                  Open report in browser
  --compare=<path>        Compare with previous test results
```

**Purpose**: Generate and display comprehensive test reports

## Technical Implementation

### 1. oclif Configuration

```typescript
// package.json oclif configuration
{
  "oclif": {
    "bin": "workflow-test",
    "dirname": "workflow-test",
    "commands": "./dist/commands",
    "plugins": [
      "@oclif/plugin-help",
      "@oclif/plugin-plugins"
    ],
    "topicSeparator": " ",
    "topics": {
      "import": {
        "description": "Schedule import testing commands"
      },
      "verify": {
        "description": "Dashboard verification commands"  
      }
    }
  }
}
```

### 2. Core Testing Infrastructure

#### Test Orchestrator (`src/cli/TestOrchestrator.ts`)

```typescript
interface TestConfig {
  mode: 'megaparse' | 'secure' | 'legacy';
  scheduleFile?: string;
  expectedPatients: number;
  timeout: number;
  screenshotPath?: string;
}

interface TestResult {
  success: boolean;
  importTime: number;
  patientsImported: number;
  dashboardVerified: boolean;
  screenshotPath?: string;
  errors: string[];
  logs: string[];
}

class TestOrchestrator {
  async runImportTest(config: TestConfig): Promise<TestResult>
  async verifyDashboardState(expected: ExpectedState): Promise<VerificationResult>
  async takeScreenshot(path: string): Promise<string>
  async generateReport(results: TestResult[]): Promise<string>
}
```

#### Browser Automation (`src/cli/BrowserController.ts`)

```typescript
interface BrowserController {
  launch(): Promise<void>
  navigateToApp(): Promise<void>
  importSchedule(file: string, mode: string): Promise<ImportResult>
  getDashboardState(): Promise<DashboardState>
  takeScreenshot(path: string): Promise<string>
  close(): Promise<void>
}
```

### 3. Data Validation Framework

#### Patient Data Validator (`src/cli/validators/PatientValidator.ts`)

```typescript
interface ValidationRule {
  field: keyof Patient;
  required: boolean;
  validator: (value: any) => boolean;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

class PatientValidator {
  validatePatient(patient: Patient): ValidationResult
  validatePatientList(patients: Patient[]): ValidationResult
  validateAgainstExpected(actual: Patient[], expected: PatientExpectation[]): ValidationResult
}
```

### 4. Dashboard State Inspector

#### Dashboard Inspector (`src/cli/inspectors/DashboardInspector.ts`)

```typescript
interface DashboardState {
  patientsDisplayed: number;
  currentProvider: string;
  scheduleDate: string;
  visiblePatients: PatientSummary[];
  uiElements: UIElementState[];
}

interface UIElementState {
  selector: string;
  visible: boolean;
  text?: string;
  count?: number;
}

class DashboardInspector {
  getDashboardState(): Promise<DashboardState>
  verifyPatientDisplay(expectedPatients: Patient[]): Promise<VerificationResult>
  checkUIElements(expectedElements: UIElementState[]): Promise<VerificationResult>
}
```

## File Structure

```
src/
├── cli/
│   ├── commands/
│   │   ├── import.ts              # Import testing command
│   │   ├── verify.ts              # Dashboard verification command
│   │   ├── test-suite.ts          # Complete test suite command
│   │   ├── generate-data.ts       # Test data generation command
│   │   └── report.ts              # Report generation command
│   ├── lib/
│   │   ├── TestOrchestrator.ts    # Main test orchestration
│   │   ├── BrowserController.ts   # Browser automation
│   │   ├── ReportGenerator.ts     # Test report generation
│   │   └── TestDataManager.ts     # Test data management
│   ├── validators/
│   │   ├── PatientValidator.ts    # Patient data validation
│   │   └── DashboardValidator.ts  # Dashboard state validation
│   ├── inspectors/
│   │   ├── DashboardInspector.ts  # Dashboard state inspection
│   │   └── ContextInspector.ts    # Application context inspection
│   └── fixtures/
│       ├── lukner-sample.txt      # Sample Lukner clinic data
│       ├── tsv-sample.txt         # Sample TSV data
│       └── test-expectations.json # Expected test results
├── types/
│   └── cli.ts                     # CLI-specific type definitions
└── bin/
    └── workflow-test              # CLI entry point
```

## Test Data Management

### Built-in Test Data Sets

#### 1. Lukner Medical Clinic Sample

```
// fixtures/lukner-sample.txt
Appointments for Tuesday, July 01, 2025
Lukner Medical Clinic
RALF LUKNER 9:45 AM Cancelled ANITA BURGER
12/05/1956
(503) 420-6404
... [complete sample data]
```

#### 2. TSV Sample

```
// fixtures/tsv-sample.txt
06/28/2025 09:00 AM Confirmed TONYA LEWIS 04/03/1956 Office Visit INSURANCE 2025 $0.00
... [complete TSV data]
```

#### 3. Expected Results

```json
// fixtures/test-expectations.json
{
  "luknerSample": {
    "expectedPatients": 4,
    "patients": [
      {
        "name": "ANITA BURGER",
        "status": "Cancelled",
        "dob": "1956-12-05",
        "provider": "RALF LUKNER"
      }
    ]
  }
}
```

## Error Handling & Recovery

### Error Categories

1. **Import Errors**: File not found, parsing failures, validation errors
2. **Browser Errors**: Navigation failures, element not found, timeout errors  
3. **Verification Errors**: State mismatch, missing patients, UI element issues
4. **System Errors**: Network issues, permission errors, resource constraints

### Recovery Strategies

1. **Retry Logic**: Automatic retry for transient failures
2. **Fallback Modes**: Switch to alternative parsing modes on failure
3. **Partial Success**: Continue testing even if some steps fail
4. **Cleanup**: Ensure proper cleanup even after failures

## Performance Requirements

### Timing Targets

- **Schedule Import**: < 5 seconds for typical clinic schedule
- **Dashboard Rendering**: < 2 seconds for up to 50 patients
- **Screenshot Capture**: < 1 second per screenshot
- **Full Test Suite**: < 2 minutes for all modes

### Resource Limits

- **Memory**: < 512MB during testing
- **CPU**: Minimal impact on host system
- **Storage**: < 100MB for test results and screenshots

## Security Considerations

### Data Protection

- **PHI Handling**: All test data must be de-identified or synthetic
- **Secure Cleanup**: Automatic cleanup of sensitive test data
- **Access Control**: CLI requires appropriate permissions

### Test Isolation

- **Sandbox Mode**: Tests run in isolated environment
- **State Isolation**: No interference with production data
- **Clean Startup**: Each test starts with clean application state

## Reporting & Documentation

### Test Report Contents

1. **Executive Summary**: Pass/fail status, key metrics
2. **Detailed Results**: Per-test breakdown with timings
3. **Screenshots**: Visual proof of Dashboard state
4. **Performance Metrics**: Import times, rendering performance
5. **Error Analysis**: Detailed error logs and recovery actions
6. **Recommendations**: Suggested improvements based on test results

### Report Formats

- **HTML**: Interactive report with embedded screenshots
- **JSON**: Machine-readable results for CI/CD integration
- **Markdown**: Human-readable summary for documentation

## Usage Examples

### Basic Import Test

```bash
# Test MegaParse import with built-in Lukner clinic data
workflow-test import --mode=megaparse --screenshot --verify-count=4

# Test with custom data file
workflow-test import custom-schedule.txt --mode=secure --output=./test-results
```

### Dashboard Verification

```bash
# Verify current Dashboard state
workflow-test verify --patients=4 --provider="RALF LUKNER" --screenshot

# Verify after manual import
workflow-test verify --screenshot --output=./verification-results
```

### Complete Test Suite

```bash
# Run all tests with all modes
workflow-test test-suite --output=./full-test-results --cleanup

# Run parallel tests with custom data
workflow-test test-suite --modes=megaparse,secure --data-sets=data1.txt,data2.txt --parallel
```

### Report Generation

```bash
# Generate HTML report
workflow-test report ./test-results --format=html --open

# Compare with previous results
workflow-test report ./latest-results --compare=./baseline-results
```

## Implementation Notes

### Dependencies

- **oclif**: CLI framework
- **puppeteer**: Browser automation for screenshots and verification
- **chalk**: Colored terminal output
- **inquirer**: Interactive prompts
- **fs-extra**: Enhanced file system operations
- **jimp**: Image processing for screenshots

### Development Phases

#### Phase 1: Core Infrastructure

1. oclif setup and basic command structure
2. TestOrchestrator implementation
3. Basic import testing functionality

#### Phase 2: Browser Integration  

1. BrowserController implementation
2. Dashboard inspection capabilities
3. Screenshot capture functionality

#### Phase 3: Advanced Features

1. Complete test suite orchestration
2. Report generation and analysis
3. Performance monitoring

#### Phase 4: Polish & Documentation

1. Comprehensive error handling
2. User documentation and examples
3. CI/CD integration guides

This design provides a comprehensive foundation for implementing complete integration testing of the schedule import workflow with full Dashboard verification capabilities.
