import HealthCheckCommand from '../../commands/health-check';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

describe('HealthCheckCommand Unit Tests', () => {
  let command: HealthCheckCommand;
  let mockParse: jest.Mock;
  let mockLog: jest.Mock;
  let mockError: jest.Mock;
  let mockWarn: jest.Mock;
  let mockRun: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test

    mockParse = jest.fn().mockResolvedValue({ flags: {}, args: {} });
    mockLog = jest.fn();
    mockError = jest.fn();
    mockWarn = jest.fn();
    mockRun = jest.fn();

    // Manually mock the oclif Command methods on the prototype
    jest.spyOn(HealthCheckCommand.prototype, 'parse').mockImplementation(mockParse);
    jest.spyOn(HealthCheckCommand.prototype, 'log').mockImplementation(mockLog);
    jest.spyOn(HealthCheckCommand.prototype, 'error').mockImplementation(mockError);
    jest.spyOn(HealthCheckCommand.prototype, 'warn').mockImplementation(mockWarn);
    jest.spyOn(HealthCheckCommand.prototype, 'run').mockImplementation(mockRun);

    jest.spyOn(require('child_process'), 'execSync').mockImplementation(jest.fn());
    jest.spyOn(require('child_process'), 'spawn').mockImplementation(jest.fn(() => ({
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
    })));

    jest.spyOn(require('fs'), 'existsSync').mockImplementation(jest.fn());
    jest.spyOn(require('path'), 'join').mockImplementation(jest.fn());

    // Mock chalk
    const mockChalk: any = {};
    const colorMethods = ['cyan', 'yellow', 'white', 'red', 'green', 'gray'];
    colorMethods.forEach(color => {
      mockChalk[color] = jest.fn((text) => {
        const chainable = jest.fn(() => text);
        chainable.bold = jest.fn(() => text);
        return chainable;
      });
    });
    mockChalk.bold = jest.fn((text) => text);
    jest.mock('chalk', () => ({
      __esModule: true,
      default: mockChalk,
    }));

    command = new HealthCheckCommand([], null);
    process.exitCode = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should run standard checks by default', async () => {
    mockParse.mockResolvedValueOnce({ flags: {}, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true); // Mock all existsync to return true for passing checks
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

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('{
  "timestamp":'));
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
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(1); },
    }));

    await command.run();

    expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('NOT READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(1);
  });
});