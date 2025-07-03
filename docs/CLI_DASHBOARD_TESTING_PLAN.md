# CLI-Based Dashboard Testing Plan

**Version**: 1.0  
**Date**: 2025-01-03  
**Purpose**: Comprehensive CLI testing for all dashboard buttons, debug options, and functionality validation

## Overview

This document outlines CLI-based testing strategies to validate every interactive element of the patient flow dashboard, with particular focus on identifying why "Sync Today" is failing and ensuring all debug features work correctly.

## Dashboard Components to Test

### 1. **Tebra Integration Dashboard**

#### 1.1 Connection Testing
```bash
# Test Tebra connection via CLI
npx workflow-test tebra:connection --validate-all
npx workflow-test tebra:proxy --health-check
npx workflow-test tebra:soap --endpoint-test

# Validate dashboard "Test Connection" button
npx workflow-test dashboard:button --target="test-connection" --verify-response
```

#### 1.2 Sync Today Functionality
```bash
# Critical: Test the failing "Sync Today" feature
npx workflow-test tebra:sync-today --debug --verbose
npx workflow-test tebra:appointments --date=today --validate-import
npx workflow-test dashboard:sync --target="today" --check-errors

# Compare CLI results with dashboard button behavior
npx workflow-test dashboard:button --target="sync-today" --compare-cli-results
```

#### 1.3 Debug Options Testing
```bash
# Test all Tebra debug dashboard options
npx workflow-test tebra:debug --all-options
npx workflow-test tebra:health-checks --comprehensive
npx workflow-test tebra:php-proxy --diagnostics
npx workflow-test tebra:data-transform --validate
```

### 2. **Main Patient Dashboard**

#### 2.1 Patient Import Testing
```bash
# Test MegaParse import (confirmed working)
npx workflow-test import --file="test-schedule.csv" --mode="megaparse" --verify-dashboard
npx workflow-test dashboard:patients --count-validation
npx workflow-test dashboard:refresh --check-persistence

# Test other import modes
npx workflow-test import --file="test-schedule.csv" --mode="secure" --verify-dashboard
npx workflow-test import --file="test-schedule.csv" --mode="legacy" --verify-dashboard
```

#### 2.2 Patient Status Buttons
```bash
# Test all patient status transition buttons
npx workflow-test dashboard:patient-status --from="scheduled" --to="arrived" --validate
npx workflow-test dashboard:patient-status --from="arrived" --to="appt-prep" --validate
npx workflow-test dashboard:patient-status --from="appt-prep" --to="ready-for-md" --validate
npx workflow-test dashboard:patient-status --from="ready-for-md" --to="With Doctor" --validate
npx workflow-test dashboard:patient-status --from="With Doctor" --to="seen-by-md" --validate
npx workflow-test dashboard:patient-status --from="seen-by-md" --to="completed" --validate
```

#### 2.3 Room Assignment Testing
```bash
# Test room assignment functionality
npx workflow-test dashboard:room-assignment --patient-id="test-patient-1" --room="1" --validate
npx workflow-test dashboard:room-assignment --patient-id="test-patient-2" --room="2" --validate
npx workflow-test dashboard:rooms --availability-check
```

#### 2.4 Time Controls Testing
```bash
# Test time simulation controls
npx workflow-test dashboard:time --mode="simulation" --enable
npx workflow-test dashboard:time --adjust="+1hour" --validate-impact
npx workflow-test dashboard:time --mode="real" --reset
```

### 3. **Modal and Form Testing**

#### 3.1 New Patient Form
```bash
# Test new patient creation modal
npx workflow-test dashboard:modal --target="new-patient" --fill-form --submit
npx workflow-test dashboard:patient --create --name="CLI Test Patient" --validate
```

#### 3.2 Import Schedule Modal
```bash
# Test import schedule modal
npx workflow-test dashboard:modal --target="import-schedule" --file-upload --validate
npx workflow-test dashboard:import --modal-workflow --verify-completion
```

#### 3.3 Report Generation
```bash
# Test report generation buttons
npx workflow-test dashboard:export --format="json" --validate-data
npx workflow-test dashboard:export --format="csv" --validate-data
npx workflow-test dashboard:report --generate --verify-content
```

### 4. **Metrics and Display Testing**

#### 4.1 Metrics Panel Validation
```bash
# Test metrics calculations
npx workflow-test dashboard:metrics --validate-calculations
npx workflow-test dashboard:wait-times --verify-accuracy
npx workflow-test dashboard:patient-counts --cross-validate
```

#### 4.2 Real-time Updates
```bash
# Test real-time dashboard updates
npx workflow-test dashboard:realtime --monitor-updates --duration=60s
npx workflow-test dashboard:polling --check-intervals
npx workflow-test dashboard:persistence --verify-after-refresh
```

## Comprehensive Test Scenarios

### Scenario 1: "Sync Today" Failure Investigation
```bash
#!/bin/bash
# Complete diagnostic of Sync Today failure

echo "🔍 Investigating Sync Today Failure"

# Step 1: Test Tebra connection
npx workflow-test tebra:connection --comprehensive | tee sync-today-debug.log

# Step 2: Test authentication
npx workflow-test tebra:auth --validate-tokens | tee -a sync-today-debug.log

# Step 3: Test appointment retrieval
npx workflow-test tebra:appointments --date=today --raw-response | tee -a sync-today-debug.log

# Step 4: Test data transformation
npx workflow-test tebra:transform --appointments-today --validate-format | tee -a sync-today-debug.log

# Step 5: Test dashboard update
npx workflow-test dashboard:update --source="tebra" --validate-import | tee -a sync-today-debug.log

# Step 6: Compare with manual dashboard button click
npx workflow-test dashboard:button --target="sync-today" --capture-errors | tee -a sync-today-debug.log

echo "📊 Sync Today diagnostic complete. Check sync-today-debug.log for details."
```

### Scenario 2: End-to-End Dashboard Validation
```bash
#!/bin/bash
# Complete dashboard functionality test

echo "🧪 Comprehensive Dashboard Testing"

# Test all major buttons and features
BUTTONS=("test-connection" "sync-today" "refresh-now" "new-patient" "import-schedule" "export-json" "export-csv")

for button in "${BUTTONS[@]}"; do
    echo "Testing button: $button"
    npx workflow-test dashboard:button --target="$button" --validate-response
    sleep 2
done

# Test all patient status transitions
STATUSES=("scheduled" "arrived" "appt-prep" "ready-for-md" "With Doctor" "seen-by-md" "completed")

for i in $(seq 0 $((${#STATUSES[@]}-2))); do
    from_status="${STATUSES[$i]}"
    to_status="${STATUSES[$i+1]}"
    echo "Testing transition: $from_status -> $to_status"
    npx workflow-test dashboard:transition --from="$from_status" --to="$to_status" --validate
done

# Test metrics accuracy
npx workflow-test dashboard:metrics --comprehensive-validation

echo "✅ Dashboard testing complete"
```

### Scenario 3: Performance and Persistence Testing
```bash
#!/bin/bash
# Test dashboard performance and data persistence

echo "⚡ Dashboard Performance Testing"

# Load test with multiple patients
npx workflow-test dashboard:load --patients=50 --measure-performance

# Test persistence across page refreshes
npx workflow-test dashboard:persistence --refresh-cycles=5 --validate-data

# Test concurrent user scenarios
npx workflow-test dashboard:concurrent --users=3 --duration=120s

# Memory and performance monitoring
npx workflow-test dashboard:performance --monitor-memory --duration=300s

echo "📈 Performance testing complete"
```

## CLI Command Extensions Needed

### New CLI Commands for Dashboard Testing

#### 1. Dashboard Button Testing
```typescript
// src/cli/commands/dashboard-test.ts
export class DashboardTestCommand extends Command {
  static description = 'Test dashboard buttons and UI elements via browser automation'
  
  static flags = {
    target: Flags.string({description: 'Target button/element to test'}),
    'validate-response': Flags.boolean({description: 'Validate response after button click'}),
    'capture-errors': Flags.boolean({description: 'Capture any JavaScript errors'}),
    'compare-cli-results': Flags.boolean({description: 'Compare with equivalent CLI operation'})
  }
}
```

#### 2. Tebra Integration Testing
```typescript
// src/cli/commands/tebra-debug.ts
export class TebraDebugCommand extends Command {
  static description = 'Debug Tebra integration issues with comprehensive testing'
  
  static flags = {
    'sync-today': Flags.boolean({description: 'Test Sync Today functionality specifically'}),
    'connection': Flags.boolean({description: 'Test Tebra connection health'}),
    'debug': Flags.boolean({description: 'Enable debug logging'}),
    'comprehensive': Flags.boolean({description: 'Run all Tebra tests'})
  }
}
```

#### 3. Dashboard State Validation
```typescript
// src/cli/commands/dashboard-validate.ts
export class DashboardValidateCommand extends Command {
  static description = 'Validate dashboard state consistency and data accuracy'
  
  static flags = {
    'metrics': Flags.boolean({description: 'Validate metrics calculations'}),
    'patients': Flags.boolean({description: 'Validate patient data consistency'}),
    'persistence': Flags.boolean({description: 'Test data persistence'}),
    'realtime': Flags.boolean({description: 'Monitor real-time updates'})
  }
}
```

## Test Automation Integration

### CI/CD Pipeline Integration
```yaml
# .github/workflows/dashboard-testing.yml
name: Dashboard Comprehensive Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  dashboard-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build CLI
      run: npm run build:cli
      
    - name: Run Dashboard Button Tests
      run: |
        npx workflow-test dashboard:comprehensive --ci-mode
        
    - name: Test Sync Today Functionality
      run: |
        npx workflow-test tebra:sync-today --debug --fail-on-error
        
    - name: Validate Dashboard Persistence
      run: |
        npx workflow-test dashboard:persistence --cycles=3
        
    - name: Upload Test Results
      uses: actions/upload-artifact@v3
      with:
        name: dashboard-test-results
        path: |
          dashboard-test-results.json
          sync-today-debug.log
```

### Monitoring Dashboard
```typescript
// src/cli/lib/DashboardMonitor.ts
export class DashboardMonitor {
  async monitorAllButtons(): Promise<DashboardTestReport> {
    const buttons = [
      'test-connection',
      'sync-today', 
      'refresh-now',
      'new-patient',
      'import-schedule',
      'export-json',
      'export-csv'
    ];
    
    const results = [];
    
    for (const button of buttons) {
      const result = await this.testButton(button);
      results.push(result);
      
      if (!result.success && button === 'sync-today') {
        // Special handling for critical Sync Today failure
        await this.investigateSyncTodayFailure();
      }
    }
    
    return {
      timestamp: new Date().toISOString(),
      totalButtons: buttons.length,
      successfulButtons: results.filter(r => r.success).length,
      failedButtons: results.filter(r => !r.success),
      detailedResults: results
    };
  }
  
  private async investigateSyncTodayFailure(): Promise<void> {
    // Comprehensive diagnosis of Sync Today failure
    console.log('🚨 Sync Today failure detected - starting investigation...');
    
    // Test each step of the sync process
    await this.testTebraConnection();
    await this.testTebraAuthentication();
    await this.testAppointmentRetrieval();
    await this.testDataTransformation();
    await this.testDashboardUpdate();
  }
}
```

## Expected Outcomes

### Immediate Actions
1. **Identify Sync Today Failure Root Cause** - CLI tests will pinpoint exactly where the sync process breaks
2. **Validate All Dashboard Buttons** - Ensure every interactive element works correctly
3. **Cross-validate CLI vs Dashboard** - Ensure CLI operations match dashboard behavior
4. **Performance Baseline** - Establish performance metrics for dashboard operations

### Long-term Benefits
1. **Automated Dashboard Testing** - Continuous validation of all dashboard functionality
2. **Regression Prevention** - Catch dashboard issues before they reach production
3. **Performance Monitoring** - Track dashboard performance over time
4. **Integration Validation** - Ensure Tebra integration remains stable

This comprehensive CLI testing plan will provide complete visibility into dashboard functionality and help identify exactly why "Sync Today" is failing while ensuring all other features work correctly.