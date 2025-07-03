# Testing Integration Guide

**Version**: 1.0  
**Date**: 2025-07-03  
**Author**: Claude Code Assistant  

## Quick Start

### Prerequisites

```bash
# Build the CLI
npm run build:cli

# Verify CLI is working (once command discovery is resolved)
npm run workflow-test -- --help
```

### Basic Schedule Import Test

```bash
# Test schedule import with patient persistence verification
npm run workflow-test -- import --mode=megaparse --screenshot --verify-count=4
```

## Integration Patterns

### 1. Development Workflow Integration

#### Pre-Commit Testing

```bash
#!/bin/bash
# .git/hooks/pre-commit
npm run build:cli
npm run workflow-test -- health-check
npm run workflow-test -- import --mode=megaparse --headless --verify-count=4
```

#### Feature Development Testing

```bash
# Test specific import mode during development
npm run workflow-test -- import --mode=megaparse --screenshot --verbose --output=./dev-test-results

# Test patient persistence with custom data
npm run workflow-test -- import ./test-data/sample-schedule.txt --verify-count=5 --screenshot
```

### 2. CI/CD Pipeline Integration

#### GitHub Actions Workflow

```yaml
name: Schedule Import Testing
on: [push, pull_request]

jobs:
  test-schedule-import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build CLI
        run: npm run build:cli
      
      - name: Health Check
        run: npm run workflow-test -- health-check
      
      - name: Test MegaParse Import
        run: npm run workflow-test -- import --mode=megaparse --headless --verify-count=4
      
      - name: Test Secure Import
        run: npm run workflow-test -- import --mode=secure --headless --verify-count=4
      
      - name: Test Legacy Import
        run: npm run workflow-test -- import --mode=legacy --headless --verify-count=4
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
```

### 3. Local Testing Scripts

#### Comprehensive Test Script

```bash
#!/bin/bash
# scripts/test-comprehensive.sh

set -e

echo "🧪 Comprehensive Schedule Import Testing"
echo "========================================"

# Build CLI
echo "📦 Building CLI..."
npm run build:cli

# Health check
echo "🏥 Running health check..."
npm run workflow-test -- health-check

# Test all import modes
MODES=("megaparse" "secure" "legacy")
for mode in "${MODES[@]}"; do
  echo "🔄 Testing $mode mode..."
  npm run workflow-test -- import \
    --mode=$mode \
    --verify-count=4 \
    --screenshot \
    --output=./results-$mode \
    --verbose
done

echo "✅ All tests completed!"
echo "📊 Results available in ./results-* directories"
```

#### Quick Development Test

```bash
#!/bin/bash
# scripts/test-quick.sh

npm run build:cli && \
npm run workflow-test -- import \
  --mode=megaparse \
  --screenshot \
  --verify-count=4 \
  --output=./quick-test
```

### 4. Test Data Management

#### Test Schedule Files

```
test-data/
├── schedule-small.txt      # 2-3 patients for quick testing
├── schedule-medium.txt     # 10-15 patients for standard testing
├── schedule-large.txt      # 50+ patients for stress testing
├── schedule-malformed.txt  # Invalid data for error testing
└── schedule-empty.txt      # Empty file for edge case testing
```

#### Test Data Usage

```bash
# Test with different data sizes
npm run workflow-test -- import ./test-data/schedule-small.txt --verify-count=3
npm run workflow-test -- import ./test-data/schedule-medium.txt --verify-count=12
npm run workflow-test -- import ./test-data/schedule-large.txt --verify-count=50

# Test error handling
npm run workflow-test -- import ./test-data/schedule-malformed.txt --expect-failure
```

## Test Scenarios

### 1. Patient Persistence Verification

#### Scenario: Basic Import and Persistence

```bash
# Import patients and verify they persist in dashboard
npm run workflow-test -- import \
  --mode=megaparse \
  --verify-count=4 \
  --screenshot \
  --timeout=30000 \
  --verbose
```

**Expected Results**:

- ✅ 4 patients imported successfully
- ✅ Patients visible in dashboard UI
- ✅ Screenshot shows populated dashboard
- ✅ Test report confirms persistence within session

#### Scenario: Multi-Mode Persistence Comparison

```bash
# Test patient persistence across different import modes
for mode in megaparse secure legacy; do
  npm run workflow-test -- import \
    --mode=$mode \
    --verify-count=4 \
    --screenshot \
    --output=./persistence-test-$mode
done

# Compare results across modes
diff ./persistence-test-megaparse/import-test-report.json \
     ./persistence-test-secure/import-test-report.json
```

### 2. Dashboard Verification Scenarios

#### Scenario: Visual Dashboard Verification

```bash
# Capture screenshots for visual verification
npm run workflow-test -- import \
  --mode=megaparse \
  --screenshot \
  --verify-count=5 \
  --output=./visual-verification

# Screenshots will be saved as:
# ./visual-verification/screenshot-megaparse-[timestamp].png
```

#### Scenario: Dashboard Component Testing

```bash
# Verify specific dashboard components
npm run workflow-test -- verify \
  --check-patients=4 \
  --check-metrics \
  --screenshot \
  --output=./dashboard-verification
```

### 3. Performance and Load Testing

#### Scenario: Import Performance Testing

```bash
# Test import performance with timing
npm run workflow-test -- import \
  --mode=megaparse \
  --verify-count=20 \
  --timeout=60000 \
  --verbose \
  --output=./performance-test

# Check import time in test report
cat ./performance-test/import-test-report.json | jq '.importTime'
```

#### Scenario: Large Dataset Testing

```bash
# Test with large schedule file
npm run workflow-test -- import \
  ./test-data/schedule-large.txt \
  --mode=megaparse \
  --verify-count=50 \
  --timeout=120000 \
  --headless \
  --output=./large-dataset-test
```

## Monitoring and Alerting

### 1. Test Result Monitoring

#### Parse Test Results for CI

```bash
#!/bin/bash
# scripts/check-test-results.sh

RESULT_FILE="./test-results/import-test-report.json"

if [ ! -f "$RESULT_FILE" ]; then
  echo "❌ Test results file not found"
  exit 1
fi

SUCCESS=$(cat "$RESULT_FILE" | jq -r '.success')
PATIENTS_IMPORTED=$(cat "$RESULT_FILE" | jq -r '.patientsImported')
EXPECTED_PATIENTS=4

if [ "$SUCCESS" = "true" ] && [ "$PATIENTS_IMPORTED" -eq "$EXPECTED_PATIENTS" ]; then
  echo "✅ Test passed: $PATIENTS_IMPORTED patients imported successfully"
  exit 0
else
  echo "❌ Test failed: Expected $EXPECTED_PATIENTS patients, got $PATIENTS_IMPORTED"
  cat "$RESULT_FILE" | jq -r '.errors[]'
  exit 1
fi
```

### 2. Automated Alerts

#### Slack Webhook Integration

```bash
#!/bin/bash
# scripts/notify-test-results.sh

WEBHOOK_URL="YOUR_SLACK_WEBHOOK_URL"
RESULT_FILE="./test-results/import-test-report.json"

if [ -f "$RESULT_FILE" ]; then
  SUCCESS=$(cat "$RESULT_FILE" | jq -r '.success')
  PATIENTS=$(cat "$RESULT_FILE" | jq -r '.patientsImported')
  
  if [ "$SUCCESS" = "true" ]; then
    MESSAGE="✅ Schedule import test passed: $PATIENTS patients imported successfully"
  else
    MESSAGE="❌ Schedule import test failed: Check logs for details"
  fi
  
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$MESSAGE\"}" \
    "$WEBHOOK_URL"
fi
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: CLI Commands Not Found

```bash
# Check if CLI built correctly
ls -la dist/cli/commands/

# Verify oclif configuration
cat package.json | jq '.oclif'

# Try rebuilding
rm -rf dist && npm run build:cli
```

#### Issue: Browser Tests Fail in Headless Mode

```bash
# Run with visible browser for debugging
npm run workflow-test -- import --no-headless --verbose

# Check screenshot for visual debugging
npm run workflow-test -- import --screenshot --output=./debug-screenshots
```

#### Issue: Import Timeout

```bash
# Increase timeout for slow systems
npm run workflow-test -- import --timeout=60000

# Use smaller test dataset
npm run workflow-test -- import ./test-data/schedule-small.txt --verify-count=2
```

### Debug Commands

#### Verbose Logging

```bash
# Enable detailed logging
npm run workflow-test -- import --verbose --output=./debug-logs

# Check generated logs
cat ./debug-logs/import-test-report.json | jq '.logs'
```

#### Health Check Diagnostics

```bash
# Run comprehensive health check
npm run workflow-test -- health-check --verbose

# Check system prerequisites
npm run workflow-test -- health-check --check-browser --check-deps
```

## Best Practices

### 1. Test Organization

#### Directory Structure

```
test-results/
├── daily/
│   ├── 2025-07-03/
│   │   ├── megaparse/
│   │   ├── secure/
│   │   └── legacy/
│   └── 2025-07-04/
├── feature-branches/
│   ├── feature-new-parser/
│   └── feature-dashboard-update/
└── regression/
    ├── release-1.0/
    └── release-1.1/
```

#### Test Naming Convention

```bash
# Use descriptive output directories
npm run workflow-test -- import --output=./test-results/daily/$(date +%Y-%m-%d)/megaparse
npm run workflow-test -- import --output=./test-results/feature-branches/feature-new-parser
npm run workflow-test -- import --output=./test-results/regression/pre-release-$(git rev-parse --short HEAD)
```

### 2. Test Data Management

#### Version Control for Test Data

```bash
# Keep test data in version control
git add test-data/
git commit -m "Add test schedule data for automated testing"

# Use git LFS for large test files
git lfs track "test-data/*.txt"
```

#### Test Data Validation

```bash
# Validate test data before running tests
npm run workflow-test -- verify-data ./test-data/schedule-medium.txt --expected-count=12
```

### 3. Result Archival

#### Automated Result Archival

```bash
#!/bin/bash
# scripts/archive-results.sh

DATE=$(date +%Y-%m-%d)
ARCHIVE_DIR="./archived-results/$DATE"

mkdir -p "$ARCHIVE_DIR"
cp -r ./test-results/* "$ARCHIVE_DIR/"

# Compress old results
find ./archived-results -type d -mtime +30 -exec tar -czf {}.tar.gz {} \; -exec rm -rf {} \;
```

## Conclusion

This integration guide provides comprehensive patterns for incorporating schedule import testing into development workflows. The CLI testing system enables automated verification that **schedule import has been tested and patients persist at least within one app session**, providing confidence in the complete patient flow management workflow.

Key benefits:

- ✅ **Automated Verification**: Schedule import → patient persistence → dashboard display
- ✅ **Multi-Environment Support**: Development, CI/CD, and production testing
- ✅ **Visual Verification**: Screenshot capture for manual review
- ✅ **Comprehensive Reporting**: Detailed JSON reports with metrics and logs
- ✅ **Flexible Integration**: Easy integration with existing development workflows
