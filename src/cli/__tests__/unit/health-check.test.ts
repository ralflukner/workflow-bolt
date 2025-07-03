import HealthCheckCommand from '../../commands/health-check';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Mock oclif's Command class and its methods
const mockParse = jest.fn().mockResolvedValue({ flags: {}, args: {} });
const mockLog = jest.fn();
const mockError = jest.fn();

jest.mock('@oclif/core', () => ({
  Command: class {
    parse = mockParse;
    log = mockLog;
    error = mockError;
    warn = jest.fn();
    static flags = {};
    static summary = '';
    static description = '';
    static examples = [];
  },
  Flags: {
    boolean: jest.fn((opts) => opts),
    integer: jest.fn((opts) => opts),
  },
}));

// Mock child_process functions
jest.mock('child_process', () => ({
  execSync: jest.fn(),
  spawn: jest.fn(() => ({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
  })),
}));

// Mock fs.existsSync
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}));

// Mock path.join
jest.mock('path', () => ({
  join: jest.fn(),
}));

// Mock chalk
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
  },
}));

describe('HealthCheckCommand Unit Tests', () => {
  let command: HealthCheckCommand;

  beforeEach(() => {
    command = new HealthCheckCommand([], null);
    jest.clearAllMocks();
    process.exitCode = undefined; // Reset exit code before each test
  });

  it('should run standard checks by default', async () => {
    mockParse.mockResolvedValueOnce({ flags: {}, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true); // Mock all existsSync to return true for passing checks
    (execSync as jest.Mock).mockReturnValue('output'); // Mock execSync to pass
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Running standard health checks'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(0);
  });

  it('should run critical checks when --critical-only flag is true', async () => {
    mockParse.mockResolvedValueOnce({ flags: { 'critical-only': true }, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true);
    (execSync as jest.Mock).mockReturnValue('output');
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Running critical system checks'));
    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(0);
  });

  it('should output JSON when --json flag is true', async () => {
    mockParse.mockResolvedValueOnce({ flags: { json: true }, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true);
    (execSync as jest.Mock).mockReturnValue('output');
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('{\n  "timestamp":'));
    expect(process.exitCode).toBe(0);
  });

  it('should attempt auto-fix when --fix-issues flag is true and issues are found', async () => {
    mockParse.mockResolvedValueOnce({ flags: { 'fix-issues': true }, args: {} });
    (existsSync as jest.Mock).mockImplementation((path: string) => {
      if (path === 'node_modules') return false; // Simulate missing node_modules
      return true;
    });
    (execSync as jest.Mock).mockImplementation((cmd: string) => {
      if (cmd.includes('npm install')) {
        (existsSync as jest.Mock).mockImplementation((path: string) => true); // Simulate node_modules created
        return 'install success';
      }
      return 'output';
    });
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Attempting to auto-fix issues'));
    expect(execSync).toHaveBeenCalledWith('npm install', expect.any(Object));
    expect(process.exitCode).toBe(0);
  });

  it('should set exit code to 1 if critical checks fail', async () => {
    mockParse.mockResolvedValueOnce({ flags: { 'critical-only': true }, args: {} });
    (existsSync as jest.Mock).mockReturnValue(false); // Simulate critical failure
    (execSync as jest.Mock).mockImplementation(() => { throw new Error('Build failed'); });
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(1); }, // Simulate test failure
    }));

    await command.run();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('NOT READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(1);
  });
});