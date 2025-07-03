/**
 * CLI Test Setup
 * Jest configuration for CLI testing environment
 */

// Mock chalk globally for all CLI tests
jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    cyan: {
      bold: jest.fn((text) => text),
    },
    yellow: jest.fn((text) => text),
    white: jest.fn((text) => text),
    red: jest.fn((text) => text),
    green: jest.fn((text) => text),
    gray: jest.fn((text) => text),
    blue: jest.fn((text) => text),
    magenta: jest.fn((text) => text),
  },
}));

// Mock Node.js modules commonly used in CLI
jest.mock('child_process', () => ({
  execSync: jest.fn(),
  spawn: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
  dirname: jest.fn(),
  basename: jest.fn(),
}));

// Mock oclif core
jest.mock('@oclif/core', () => ({
  Command: jest.fn(),
  Flags: {
    string: jest.fn(),
    boolean: jest.fn(),
    integer: jest.fn(),
  },
}));

// Global test utilities
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Set test timeout for CLI operations
jest.setTimeout(30000);