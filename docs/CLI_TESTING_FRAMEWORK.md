# CLI Testing Framework Documentation

**Version**: 1.0  
**Last Updated**: 2025-01-03  
**Status**: Implementation Complete

## Overview

This document outlines the comprehensive CLI testing framework for the workflow-bolt project, designed to ensure reliability and quality of all CLI commands and workflows.

## Architecture

### Test Organization Structure

```
src/cli/__tests__/
├── setup.ts                           # Global CLI test configuration
├── unit/
│   ├── commands/
│   │   ├── health-check.test.ts        # ✅ Health check command tests
│   │   ├── import.test.ts              # ✅ Import command tests  
│   │   ├── verify.test.ts              # ✅ Verify command tests
│   │   ├── test-runner.test.ts         # 🔄 Test runner command tests
│   │   ├── test-suite.test.ts          # 🔄 Test suite command tests
│   │   └── redis-test.test.ts          # 🔄 Redis test command tests
│   └── lib/
│       ├── TestOrchestrator.test.ts    # ✅ Core orchestration tests
│       ├── BrowserController.test.ts   # 🔄 Browser automation tests
│       └── RedisTestFramework.test.ts  # ✅ Redis coordination tests
└── integration/
    ├── import-workflow.integration.test.ts      # ✅ End-to-end import testing
    ├── dashboard-verification.integration.test.ts  # 🔄 Dashboard verification workflows
    ├── redis-coordination.integration.test.ts      # 🔄 Multi-agent coordination
    ├── multi-command.integration.test.ts           # 🔄 Command chaining workflows
    └── error-recovery.integration.test.ts          # 🔄 Failure recovery testing
```

**Legend**: ✅ Complete | 🔄 In Progress | ❌ Missing

## Jest Configuration

### CLI Test Project

The CLI testing framework uses a dedicated Jest project configuration:

```javascript
{
  displayName: 'cli',
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.cli.json',
      babelConfig: true
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/src/cli/__tests__/setup.ts'],
  testMatch: [
    '<rootDir>/src/cli/__tests__/**/*.test.(ts|tsx)',
    '<rootDir>/src/cli/**/*.test.(ts|tsx)'
  ]
}
```

### Test Commands

```bash
# Run all CLI tests
npm run test:cli

# Run CLI unit tests only
npm run test:cli:unit

# Run CLI integration tests only
npm run test:cli:integration

# Run CLI tests with coverage
npm run test:cli:coverage

# Run specific CLI command tests
npm test -- --testNamePattern="ImportCommand"
npm test -- --testNamePattern="VerifyCommand"
npm test -- --testNamePattern="TestOrchestrator"
```

## Unit Testing Framework

### Command Testing Pattern

All CLI commands follow a consistent testing pattern:

```typescript
import { CommandName } from '../../../commands/command-name';
import { TestOrchestrator } from '../../../lib/TestOrchestrator';
import { MockType } from '../../../../types/cli';

// Mock external dependencies
jest.mock('../../../lib/TestOrchestrator');
jest.mock('fs');
jest.mock('path');

describe('CommandName Unit Tests', () => {
  let command: CommandName;
  let mockOrchestrator: jest.Mocked<TestOrchestrator>;

  beforeEach(() => {
    command = new CommandName([], {} as any);
    mockOrchestrator = {
      runTest: jest.fn(),
      // ... other mocked methods
    } as any;
    jest.clearAllMocks();
  });

  describe('Flag Validation', () => {
    it('should validate required parameters', async () => {
      // Test parameter validation
    });
    
    it('should reject invalid parameters', async () => {
      // Test parameter rejection
    });
  });

  describe('Test Execution', () => {
    it('should execute test successfully', async () => {
      // Test successful execution
    });
    
    it('should handle test failures', async () => {
      // Test failure handling
    });
  });

  describe('Error Handling', () => {
    it('should handle exceptions gracefully', async () => {
      // Test exception handling
    });
  });
});
```

### Core Library Testing

Core libraries use comprehensive unit testing:

```typescript
describe('TestOrchestrator Unit Tests', () => {
  describe('Test Configuration Validation', () => {
    it('should validate required config fields', () => {
      // Validate configuration structure
    });

    it('should reject invalid import modes', () => {
      // Test mode validation
    });
  });

  describe('Import Test Execution', () => {
    it('should execute successful import test', async () => {
      // Test successful workflow
    });

    it('should handle browser initialization failure', async () => {
      // Test failure scenarios
    });
  });

  describe('Performance Metrics Tracking', () => {
    it('should track import duration accurately', async () => {
      // Test timing accuracy
    });
  });
});
```

## Integration Testing Framework

### End-to-End Workflow Testing

Integration tests validate complete workflows:

```typescript
describe('Import Workflow Integration Tests', () => {
  describe('End-to-End Import Verification Workflow', () => {
    it('should complete full import and verification cycle successfully', async () => {
      // Setup mock responses
      const expectedDashboardState = createMockDashboardState(12);
      
      // Execute import
      const importResult = await testOrchestrator.runImportTest(config);
      
      // Independent verification
      const verificationResult = await verifyCommand.run([...args]);
      
      // Cross-validate results
      expect(importResult.success).toBe(true);
      expect(verificationResult).toBeDefined();
    });

    it('should handle import success with verification failure', async () => {
      // Test data consistency issues
    });
  });

  describe('Multi-Mode Import Testing', () => {
    testModes.forEach(mode => {
      it(`should handle ${mode} mode import workflow`, async () => {
        // Test each import mode
      });
    });
  });
});
```

### Redis Coordination Testing

Multi-agent coordination via Redis Streams:

```typescript
describe('Redis Coordination Integration', () => {
  it('should coordinate import workflow via Redis streams', async () => {
    await redisFramework.initialize();
    
    const testScenario = createTestScenario();
    const coordinatedResult = await redisFramework.coordinateAgentTesting(testScenario);
    
    expect(coordinatedResult.success).toBe(true);
    expect(coordinatedResult.patientsImported).toBe(8);
  });
});
```

## Test Coverage Requirements

### Coverage Targets

| Component | Unit Test Coverage | Integration Coverage | Status |
|-----------|-------------------|---------------------|---------|
| CLI Commands | 90%+ | 80%+ | ✅ Import/Verify Complete |
| Core Libraries | 95%+ | 85%+ | ✅ TestOrchestrator/Redis Complete |
| Browser Automation | 85%+ | 70%+ | 🔄 In Progress |
| Error Handling | 90%+ | 80%+ | 🔄 In Progress |

### Critical Test Scenarios

#### Import Command Testing

- ✅ File format validation (CSV, XLSX, JSON)
- ✅ Import mode testing (megaparse, secure, legacy)
- ✅ Patient count validation
- ✅ Performance metrics tracking
- ✅ Screenshot functionality
- ✅ Error handling and recovery

#### Verify Command Testing

- ✅ Dashboard URL validation
- ✅ State extraction and validation
- ✅ Patient count verification
- ✅ Status distribution consistency
- ✅ Metrics validation
- ✅ Screenshot capture

#### TestOrchestrator Testing

- ✅ Configuration validation
- ✅ Browser automation coordination
- ✅ Test execution workflows
- ✅ Performance tracking
- ✅ Report generation
- ✅ Resource cleanup

#### Integration Workflow Testing

- ✅ End-to-end import → verification
- ✅ Multi-mode import testing
- ✅ Performance and timing validation
- ✅ Error recovery scenarios
- ✅ Redis coordination workflows

## Mock Configuration

### Global Mock Setup

The `src/cli/__tests__/setup.ts` provides global mocks:

```typescript
// Mock external dependencies
jest.mock('chalk', () => ({ /* chalk mock */ }));
jest.mock('child_process', () => ({ /* process mock */ }));
jest.mock('fs', () => ({ /* filesystem mock */ }));
jest.mock('path', () => ({ /* path mock */ }));
jest.mock('@oclif/core', () => ({ /* oclif mock */ }));

// Global test utilities
global.console = { /* console mock */ };
jest.setTimeout(30000);
```

### Browser Controller Mocking

Browser automation uses comprehensive mocking:

```typescript
const mockBrowser = {
  initialize: jest.fn(),
  navigateTo: jest.fn(),
  uploadFile: jest.fn(),
  getDashboardState: jest.fn(),
  takeScreenshot: jest.fn(),
  cleanup: jest.fn(),
} as jest.Mocked<BrowserController>;
```

### Redis Framework Mocking

Redis coordination uses selective mocking:

```typescript
jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    xadd: jest.fn().mockResolvedValue('1234567890-0'),
    xreadgroup: jest.fn().mockResolvedValue([]),
    // ... other Redis operations
  }))
}));
```

## Performance Testing

### Timing Validation

Tests validate accurate performance tracking:

```typescript
it('should track import duration accurately', async () => {
  const startTime = Date.now();
  
  // Execute with controlled delays
  mockBrowser.uploadFile.mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(true), 200))
  );
  
  const result = await orchestrator.runImportTest(config);
  
  expect(result.importTime).toBeGreaterThan(200);
  expect(result.metadata.performanceMetrics.importStartTime).toBeCloseTo(startTime, -2);
});
```

### Timeout Testing

Timeout scenarios are thoroughly tested:

```typescript
it('should handle timeout scenarios in integrated workflow', async () => {
  const shortTimeoutConfig = { ...config, timeout: 100 };
  
  // Make operations longer than timeout
  mockBrowser.initialize.mockImplementation(() => 
    new Promise(resolve => setTimeout(resolve, 200))
  );
  
  const result = await orchestrator.runImportTest(shortTimeoutConfig);
  
  expect(result.success).toBe(false);
  expect(result.errors).toContain('Test execution timeout');
});
```

## Error Handling Testing

### Exception Recovery

Error recovery is extensively tested:

```typescript
describe('Error Recovery and Resilience', () => {
  it('should recover from transient browser failures', async () => {
    let callCount = 0;
    
    mockBrowser.initialize.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Browser startup failed'));
      }
      return Promise.resolve();
    });
    
    // Test retry logic implementation
  });
});
```

### Resource Cleanup

Resource management is validated:

```typescript
it('should cleanup resources after failed test', async () => {
  mockBrowser.initialize.mockRejectedValue(new Error('Browser crash'));
  
  await orchestrator.runImportTest(config);
  
  expect(mockBrowser.cleanup).toHaveBeenCalled();
});
```

## Test Utilities and Helpers

### Mock Data Factories

Consistent test data generation:

```typescript
function createMockDashboardState(totalPatients: number): DashboardState {
  return {
    totalPatients,
    patientsByStatus: {
      scheduled: totalPatients,
      arrived: 0,
      // ... other statuses
    },
    metrics: {
      averageWaitTime: 0,
      totalWaitTime: 0,
      // ... other metrics
    },
    lastUpdated: new Date().toISOString(),
    errors: [],
    warnings: []
  };
}
```

### Test Scenario Builders

Reusable test scenario creation:

```typescript
function createTestScenario(): TestScenario {
  return {
    scenarioId: 'test-scenario-123',
    name: 'Test Multi-Agent Coordination',
    testConfigs: [/* ... */],
    coordinationStrategy: {/* ... */},
    failureHandling: {/* ... */},
    successCriteria: {/* ... */}
  };
}
```

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run CLI Tests
  run: |
    npm run test:cli:coverage
    npm run test:cli:integration
    
- name: Upload CLI Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/cli/lcov.info
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
npm run test:cli:unit
npm run lint:cli
```

## Best Practices

### Test Writing Guidelines

1. **Test Structure**: Use consistent describe/it structure
2. **Mock Management**: Clear mocks between tests
3. **Assertions**: Specific, meaningful expectations
4. **Error Testing**: Test failure scenarios extensively
5. **Resource Cleanup**: Ensure proper cleanup in all cases

### Performance Considerations

1. **Test Isolation**: Each test should be independent
2. **Mock Efficiency**: Use minimal, focused mocks
3. **Timeout Management**: Set appropriate timeouts
4. **Parallel Execution**: Ensure tests can run in parallel

### Debugging Support

1. **Detailed Error Messages**: Provide context in assertions
2. **Debug Logging**: Support debug output for troubleshooting
3. **Test Data Inspection**: Easy access to test state
4. **Reproducible Failures**: Deterministic test behavior

## Future Enhancements

### Planned Additions

1. **Visual Regression Testing**: Screenshot comparison
2. **Load Testing**: High-volume import testing
3. **Cross-Platform Testing**: Windows/macOS/Linux validation
4. **Real Browser Testing**: Actual browser integration tests
5. **API Integration Testing**: Live external service testing

### Monitoring Integration

1. **Test Metrics Dashboard**: Real-time test health monitoring
2. **Performance Trend Analysis**: Import performance over time
3. **Failure Analysis**: Automated failure categorization
4. **Coverage Tracking**: Coverage trend monitoring

## Troubleshooting

### Common Issues

1. **Mock Configuration**: Ensure proper mock setup
2. **Async Testing**: Handle promises correctly
3. **Resource Leaks**: Verify cleanup in all test paths
4. **Timing Issues**: Use proper async/await patterns

### Debug Commands

```bash
# Run single test with debug output
npm test -- --testNamePattern="ImportCommand" --verbose

# Run with coverage and open browser
npm run test:cli:coverage && open coverage/lcov-report/index.html

# Debug specific integration test
npm test -- src/cli/__tests__/integration/import-workflow.integration.test.ts --detectOpenHandles
```

This comprehensive CLI testing framework ensures reliable, maintainable, and thoroughly tested CLI functionality for the workflow-bolt project.
