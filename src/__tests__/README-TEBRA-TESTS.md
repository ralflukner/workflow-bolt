# Tebra Architecture Testing Guide

This document describes the comprehensive test suite for the Tebra API integration architecture.

## Test Architecture Overview

The Tebra testing suite consists of three levels:

```
Unit Tests (Fast, No External Dependencies)
    ↓
Integration Tests (Mocked External Services)  
    ↓
Real API Tests (Full End-to-End with Live Services)
```

## Test Files

| Test File | Level | Purpose | Environment |
|-----------|-------|---------|-------------|
| `tebraArchitecture.unit.test.ts` | Unit | Tests routing logic and function signatures | No external dependencies |
| `tebraArchitecture.integration.test.ts` | Integration | Tests authentication chain with mocked external APIs | Mocked Firebase/Tebra |
| `real-api/tebraArchitectureReal.test.ts` | End-to-End | Tests against live deployed services | Live Firebase Functions, PHP Cloud Run, Tebra |

## Running Tests

### Unit Tests (Recommended for Development)

```bash
# Run all unit tests
npm run test:unit

# Run only Tebra unit tests  
npm test -- --testNamePattern="Tebra.*Unit"

# Watch mode for development
npm run test:watch -- --testNamePattern="Tebra.*Unit"
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run only Tebra integration tests
npm run test:tebra-integration
```

**Note**: Integration tests require `RUN_INTEGRATION_TESTS=true` and will attempt to initialize Auth0/Firebase authentication.

### Real API Tests (Production Verification)

```bash
# Run all real API tests
npm run test:real-api

# Run only Tebra real API tests
npm run test:tebra-real

# Run all Tebra tests (unit + integration + real-api)
npm run test:tebra-all
```

**Requirements for Real API Tests**:

- Valid Auth0 configuration in environment variables
- Firebase project access
- Deployed Firebase Functions
- Deployed PHP Cloud Run service
- Valid Tebra API credentials

## Test Scenarios Covered

### Unit Tests

- ✅ Verify routing through Firebase Functions (not direct PHP)
- ✅ Function signature compatibility
- ✅ Error handling and propagation
- ✅ Module structure and exports
- ✅ API configuration validation

### Integration Tests

- ✅ Authentication chain (Auth0 → Firebase)
- ✅ Request routing verification
- ✅ Header inclusion (Authorization, Content-Type)
- ✅ Error handling with mocked failures
- ✅ Response structure validation

### Real API Tests

- ✅ End-to-end authentication flow
- ✅ Actual network request routing
- ✅ Live Tebra API integration
- ✅ Real appointment data retrieval
- ✅ Performance benchmarks
- ✅ Security compliance (HTTPS, header validation)
- ✅ Concurrent request handling

## Test Data

### Test Dates for Real API Tests

- **June 24, 2025**: Expected to have 4+ appointments
- **June 23, 2025**: Expected to have 15+ appointments  
- **Invalid dates**: Used for error handling tests

### Expected Responses

#### Successful Connection Test

```json
{
  "success": true,
  "data": {
    "status": "healthy"
  },
  "timestamp": "2025-06-23T05:00:00Z"
}
```

#### Successful Appointments Response

```json
{
  "success": true,
  "data": {
    "Appointments": [...],
    "SecurityResponse": {
      "Authenticated": true,
      "Authorized": true,
      "CustomerKeyValid": true
    }
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Invalid date format",
  "timestamp": "2025-06-23T05:00:00Z"
}
```

## Environment Setup

### For Unit Tests

No special setup required - all dependencies are mocked.

### For Integration Tests

```bash
export RUN_INTEGRATION_TESTS=true
```

### For Real API Tests

```bash
export RUN_REAL_API_TESTS=true

# Required environment variables
export VITE_AUTH0_DOMAIN=dev-uex7qzqmd8c4qnde.us.auth0.com
export VITE_AUTH0_CLIENT_ID=your-client-id
export VITE_AUTH0_AUDIENCE=https://api.patientflow.com
export VITE_FIREBASE_PROJECT_ID=luknerlumina-firebase
# ... other Firebase config vars
```

## Troubleshooting

### Common Issues

#### "Authentication setup failed"

- **Cause**: Invalid Auth0 configuration or network issues
- **Solution**: Verify environment variables and network connectivity
- **Debug**: Check Auth0 domain accessibility: `curl https://{domain}/.well-known/jwks.json`

#### "Firebase Functions connection failed"

- **Cause**: Firebase Functions not deployed or misconfigured
- **Solution**: Verify Functions deployment and URL in `TEBRA_PHP_API_URL` secret
- **Debug**: Test Functions directly: `curl https://us-central1-luknerlumina-firebase.cloudfunctions.net/health`

#### "Tebra SOAP authentication failed"

- **Cause**: Invalid Tebra credentials or password length issues
- **Solution**: Verify Secret Manager credentials and ensure password ≤ 20 characters
- **Debug**: Check PHP Cloud Run logs for authentication errors

### Test Debugging

#### Enable Verbose Logging

```bash
# Run tests with detailed output
npm test -- --verbose --testNamePattern="Tebra"

# Run with Jest debugging
DEBUG=jest npm test -- --testNamePattern="Tebra"
```

#### Mock Debugging

For unit tests, add debugging to see what's being called:

```javascript
beforeEach(() => {
  const mockFirebaseApi = require('../services/tebraFirebaseApi');
  mockFirebaseApi.tebraTestConnection.mockImplementation((...args) => {
    console.log('Mock called with:', args);
    return Promise.resolve({ success: true });
  });
});
```

## Performance Benchmarks

| Test Type | Expected Duration | Timeout |
|-----------|-------------------|---------|
| Unit Tests | < 100ms per test | 5s |
| Integration Tests | < 2s per test | 15s |
| Real API Tests | < 10s per test | 30s |

## Test Coverage Goals

- **Unit Tests**: 100% of routing logic
- **Integration Tests**: 95% of authentication flows  
- **Real API Tests**: 100% of critical user journeys

## Maintenance

### Adding New Tests

1. Add unit test first for fast feedback
2. Add integration test for component interaction
3. Add real API test for end-to-end verification

### Updating Test Data

When Tebra data changes:

1. Update expected appointment counts in real API tests
2. Update test dates based on available data
3. Verify error handling with new error messages

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Integration Tests  
  run: npm run test:integration
  if: env.RUN_INTEGRATION_TESTS == 'true'

- name: Run Real API Tests
  run: npm run test:real-api
  if: env.RUN_REAL_API_TESTS == 'true'
  env:
    VITE_AUTH0_DOMAIN: ${{ secrets.AUTH0_DOMAIN }}
    # ... other secrets
```

## Related Documentation

- [PHASE1_SOAP_AUTH_FIX_DESIGN.md](../../docs/PHASE1_SOAP_AUTH_FIX_DESIGN.md) - Architecture design and implementation details
- [CLAUDE.md](../../docs/CLAUDE.md) - Auth0 configuration and troubleshooting
- [Jest Configuration](../../jest.config.cjs) - Test runner configuration
