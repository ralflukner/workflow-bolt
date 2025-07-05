# Redis Error Handling Testing Guide

This document describes the comprehensive testing strategy for Redis JSON error handling in the secure Redis client.

## Overview

The Redis error handling tests cover:

1. **Unit Tests** - Mock-based tests for specific error scenarios
2. **CLI Integration Tests** - Command-line interface testing
3. **Integration Tests** - End-to-end error handling validation

## Test Files Structure

```
ai-agents/luknerlumina/
├── secure_redis_client.py              # Production code (error handling added)
├── tests/
│   ├── __init__.py                      # Test package init
│   ├── test_secure_redis_client.py      # Comprehensive unit tests
│   └── test_config.py                   # Test configuration and utilities
├── run_tests.py                         # Main test runner
└── README_REDIS_TESTING.md             # This file

src/cli/commands/
├── redis-error-test.ts                  # CLI-based error testing command
└── (other CLI commands...)
```

## Error Scenarios Covered

### 1. RedisJSON Module Missing
- **Scenario**: Redis instance doesn't have RedisJSON module installed
- **Error**: `ERR unknown command 'JSON.SET'`
- **Expected Behavior**: Raises `RuntimeError` with clear message about missing module

### 2. Connection Errors
- **Scenario**: Redis server is unreachable or connection is refused
- **Error**: `Connection refused`
- **Expected Behavior**: Raises `ConnectionError` with connection details

### 3. JSON Serialization Errors
- **Scenario**: Data contains non-serializable objects (circular references, etc.)
- **Error**: `TypeError` during JSON serialization
- **Expected Behavior**: Raises `ValueError` with data format error message

### 4. Authentication Errors
- **Scenario**: Redis requires authentication but credentials are invalid
- **Error**: `NOAUTH Authentication required`
- **Expected Behavior**: Raises `AuthenticationError` with auth details

### 5. Memory Errors
- **Scenario**: Redis is out of memory
- **Error**: `OOM command not allowed when used memory > 'maxmemory'`
- **Expected Behavior**: Raises appropriate error with memory information

## Running Tests

### Prerequisites

```bash
# Install required dependencies
pip install redis google-cloud-secret-manager

# For CLI tests, ensure Node.js dependencies are installed
npm install
```

### Unit Tests Only

```bash
# Run unit tests with basic output
cd ai-agents/luknerlumina
python3 run_tests.py --unit

# Run unit tests with verbose output
python3 run_tests.py --unit --verbose

# Run unit tests with debug output
python3 run_tests.py --unit --verbose --debug
```

### Individual Test Classes

```bash
# Run just the main Redis client tests
cd ai-agents/luknerlumina
python3 -m pytest tests/test_secure_redis_client.py::TestLuknerSecureRedisClient -v

# Run just the error recovery tests
python3 -m pytest tests/test_secure_redis_client.py::TestRedisJSONErrorRecovery -v

# Run specific test method
python3 -m pytest tests/test_secure_redis_client.py::TestLuknerSecureRedisClient::test_store_patient_data_redis_json_module_missing -v
```

### CLI-Based Tests

```bash
# Run comprehensive CLI tests
npx tsx src/cli/bin/workflow-test.ts redis-error-test --comprehensive

# Run specific CLI error tests
npx tsx src/cli/bin/workflow-test.ts redis-error-test --test-module-missing
npx tsx src/cli/bin/workflow-test.ts redis-error-test --test-connection-errors
npx tsx src/cli/bin/workflow-test.ts redis-error-test --test-serialization

# Run CLI tests with debug output
npx tsx src/cli/bin/workflow-test.ts redis-error-test --comprehensive --debug
```

### All Tests

```bash
# Run all tests (unit + CLI + integration)
cd ai-agents/luknerlumina
python3 run_tests.py --verbose
```

## Test Configuration

### Environment Variables

```bash
# Optional: Set custom Redis URL for testing
export TEST_REDIS_URL="redis://localhost:6379/15"

# Optional: Set test timeout
export TEST_TIMEOUT=30
```

### Test Data

The tests use predefined test data from `tests/test_config.py`:

```python
# Patient data for testing
TEST_PATIENT_DATA = {
    "name": "Test Patient",
    "appointment_time": "2025-07-03T14:30:00Z",
    "provider": "Dr. Test",
    "status": "scheduled",
    "phone": "555-0123",
    "mrn": "TEST123456"
}

# Workflow data for testing
TEST_WORKFLOW_DATA = {
    "step": "patient_check_in",
    "status": "active",
    "next_action": "verify_insurance",
    "patient_id": "test123",
    "priority": "normal"
}
```

## Interpreting Test Results

### Successful Test Run

```
🧪 REDIS ERROR HANDLING TEST REPORT
============================================================

✅ PASS Unit Tests: 15 passed, 0 failed

📊 OVERALL RESULTS: 15 passed, 0 failed
🎉 ALL TESTS PASSED! Redis error handling is working correctly.
============================================================
```

### Failed Test Run

```
🧪 REDIS ERROR HANDLING TEST REPORT
============================================================

❌ FAIL Unit Tests: 12 passed, 3 failed
  Errors:
    - test_store_patient_data_redis_json_module_missing: Expected RuntimeError but got ValueError
    - test_connection_error_handling: Connection error not properly caught
    - test_serialization_error_logging: Log message format incorrect

📊 OVERALL RESULTS: 12 passed, 3 failed
⚠️  3 tests failed. Please review error handling implementation.
============================================================
```

## Adding New Tests

### Adding Unit Tests

1. Open `tests/test_secure_redis_client.py`
2. Add new test methods to existing test classes or create new test classes
3. Follow the naming convention: `test_<functionality>_<scenario>`
4. Use descriptive docstrings explaining the test scenario

Example:
```python
def test_store_patient_data_timeout_error(self):
    """Test error handling for Redis operation timeouts"""
    # Arrange
    patient_id = "test123"
    patient_data = {"name": "Test Patient"}
    self.mock_redis.json.return_value.set.side_effect = redis.exceptions.TimeoutError(
        "Operation timed out"
    )

    # Act & Assert
    with self.assertRaises(RuntimeError) as context:
        self.client.store_patient_data(patient_id, patient_data)
    
    self.assertIn("Operation timeout", str(context.exception))
```

### Adding CLI Tests

1. Open `src/cli/commands/redis-error-test.ts`
2. Add new test methods to the command class
3. Add corresponding CLI flags if needed
4. Update the test summary to include new test results

### Adding Integration Tests

1. Open `tests/test_secure_redis_client.py`
2. Add new test methods to `TestRedisJSONErrorRecovery` class
3. Focus on cross-component error handling scenarios

## Continuous Integration

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Redis Error Handling Tests
  run: |
    cd ai-agents/luknerlumina
    python3 run_tests.py --verbose
```

### Pre-commit Hooks

Add to `.pre-commit-config.yaml`:

```yaml
- repo: local
  hooks:
    - id: redis-error-tests
      name: Redis Error Handling Tests
      entry: python3 ai-agents/luknerlumina/run_tests.py
      language: system
      always_run: true
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```
   ModuleNotFoundError: No module named 'secure_redis_client'
   ```
   **Solution**: Run tests from the correct directory (`ai-agents/luknerlumina/`)

2. **Redis Connection Errors in Tests**
   ```
   redis.exceptions.ConnectionError: Error 61 connecting to localhost:6379
   ```
   **Solution**: Tests use mocks by default. Check if you're accidentally connecting to real Redis.

3. **Missing Dependencies**
   ```
   ModuleNotFoundError: No module named 'redis'
   ```
   **Solution**: Install dependencies: `pip install redis google-cloud-secret-manager`

### Debug Mode

Enable debug mode for detailed test execution information:

```bash
python3 run_tests.py --verbose --debug
```

This will show:
- Detailed error messages
- Mock call verification
- Test setup and teardown information
- Step-by-step test execution

## Security Considerations

### Test Data

- Tests use mock data only
- No real patient information is used
- Test Redis database (DB 15) is separate from production
- All sensitive operations are mocked

### Error Messages

- Error messages in tests don't expose sensitive information
- Production error logging is HIPAA-compliant
- Debug output is only enabled in test environments

## Contributing

When adding new error handling:

1. **Add the error handling code** to `secure_redis_client.py`
2. **Write unit tests** for the new error scenarios
3. **Update CLI tests** if the error affects CLI operations
4. **Add integration tests** for cross-component impacts
5. **Update this documentation** with new test procedures

### Code Review Checklist

- [ ] Error handling includes proper logging
- [ ] Unit tests cover all error paths
- [ ] Error messages are clear and actionable
- [ ] Error chaining preserves original error information
- [ ] Tests verify both success and failure scenarios
- [ ] CLI tests validate error handling from user perspective