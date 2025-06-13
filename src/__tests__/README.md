
# Test Organization and Execution Strategy

This document explains how the test suite is organized and how to run different types of tests.

## 🧪 Test Types

### 1. **Unit Tests** (Always Run)

- **Location**: `src/**/*.test.ts`

- **Purpose**: Test individual functions and components in isolation

- **Characteristics**: 
  - Fast execution
  - No external dependencies
  - Always pass when code is correct
  - Use mocks for external services

**Run with**: `npm run test:unit`

### 2. **Integration Tests** (Conditional)

- **Location**: `src/**/*.integration.test.ts`

- **Purpose**: Test interactions between multiple components

- **Characteristics**:
  - Test Firebase Functions integration
  - Use real Firebase but mock external APIs
  - Moderate execution time

**Run with**: `npm run test:integration`

### 3. **Real API Tests** (Diagnostic)

- **Location**: `src/__tests__/real-api/*.test.ts`

- **Purpose**: **Test real external APIs and are DESIGNED TO FAIL when APIs are unreachable**

- **Characteristics**:
  - Test actual Tebra API connection
  - **Expected to fail when API is down**
  - Serve as monitoring/diagnostic tools
  - Help explain UI status (e.g., "Disconnected")

**Run with**: `npm run test:real-api`

## 🚀 Test Execution Commands

```bash

# Run only unit tests (default, always reliable)

npm run test:unit

# Run unit tests in watch mode

npm run test:watch

# Run integration tests (requires Firebase setup)

npm run test:integration

# Run real API tests (WILL FAIL if APIs are down - this is expected!)

npm run test:real-api

# Run all tests (including those expected to fail)

npm run test:all

# Generate coverage report

npm run test:coverage

```

## 🎯 Understanding Test Failures

### ✅ **Expected Failures** (Real API Tests)

When you see failures in **Real API Tests**, this is **normal and expected** when:

- Tebra API is unreachable

- Network connectivity issues

- API credentials are invalid

- External services are under maintenance

**These failures help diagnose why your UI shows "Disconnected" status.**

### ❌ **Unexpected Failures** (Unit/Integration Tests)

When **Unit Tests** or **Integration Tests** fail, this indicates:

- Code bugs

- Configuration issues

- Missing environment variables

- Broken mocks or test setup

## 🔧 Configuration

### Environment Variables for Conditional Testing

```bash

# Enable integration tests

export RUN_INTEGRATION_TESTS=true

# Enable real API tests (will fail if APIs are down)

export RUN_REAL_API_TESTS=true

```

### Jest Projects Configuration

The test suite uses Jest projects to organize different test types:

- **unit**: Core functionality tests

- **integration**: Firebase Functions integration

- **real-api**: External API diagnostic tests

## 📊 Monitoring and Diagnostics

### Using Real API Tests for Monitoring

The Real API Tests serve as a monitoring system:

1. **Green ✅**: All external APIs are working
2. **Red ❌**: APIs are unreachable (explains UI "Disconnected" status)

### Diagnostic Information

Real API tests provide detailed diagnostic information:

- Connection test results

- Provider availability

- Patient search capability

- Comprehensive error reporting

## 🛠️ Best Practices

### For Development

- Run `npm run test:unit` frequently during development

- Use `npm run test:watch` for TDD workflow

- Run `npm run test:integration` before commits

### For CI/CD

- Always run unit tests

- Conditionally run integration tests in staging

- Use real API tests as health checks (allow failures)

### For Production Monitoring

- Schedule `npm run test:real-api` as health checks

- Monitor failure patterns to detect API issues

- Use results to update UI status indicators

## 🔍 Troubleshooting

### "All tests are failing"

- Check if you're running real API tests

- Verify environment variables are set

- Ensure Firebase configuration is correct

### "Real API tests always fail"

- **This is expected** when external APIs are down

- Check API credentials and network connectivity

- Review Firebase Functions logs for detailed errors

### "Unit tests are slow"

- Ensure you're not accidentally running integration tests

- Check for proper mocking of external dependencies

- Verify test isolation

## 📈 Test Strategy Evolution

This test organization allows for:

- **Reliable CI/CD** (unit tests always pass when code is correct)

- **Effective debugging** (diagnostic tests explain external failures)

- **Monitoring capabilities** (real API tests as health checks)

- **Clear separation of concerns** (internal vs external dependencies) 
