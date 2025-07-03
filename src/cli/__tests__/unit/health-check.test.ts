import HealthCheckCommand from '../../commands/health-check';
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

describe('HealthCheckCommand Unit Tests', () => {
  let command: HealthCheckCommand;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test

    // Manually mock the oclif Command methods on the prototype
    jest.spyOn(HealthCheckCommand.prototype, 'parse').mockResolvedValue({ flags: {}, args: {} });
    jest.spyOn(HealthCheckCommand.prototype, 'log').mockImplementation(jest.fn());
    jest.spyOn(HealthCheckCommand.prototype, 'error').mockImplementation(jest.fn());
    jest.spyOn(HealthCheckCommand.prototype, 'warn').mockImplementation(jest.fn());
    jest.spyOn(HealthCheckCommand.prototype, 'run').mockImplementation(jest.fn());

    jest.spyOn(require('child_process'), 'execSync').mockImplementation(jest.fn());
    jest.spyOn(require('child_process'), 'spawn').mockImplementation(jest.fn(() => ({
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
    })));

    jest.spyOn(require('fs'), 'existsSync').mockImplementation(jest.fn());
    jest.spyOn(require('path'), 'join').mockImplementation(jest.fn());

    // Mock chalk
    jest.mock('chalk', () => ({
      __esModule: true,
      default: {
        cyan: { bold: jest.fn((text) => text) },
        yellow: jest.fn((text) => text),
        white: jest.fn((text) => text),
        red: jest.fn((text) => text),
        green: jest.fn((text) => text),
        gray: jest.fn((text) => text),
      },
    }));

    command = new HealthCheckCommand([], null);
    process.exitCode = undefined;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should run standard checks by default', async () => {
    (HealthCheckCommand.prototype.parse as jest.Mock).mockResolvedValueOnce({ flags: {}, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true); // Mock all existsSync to return true for passing checks
    (execSync as jest.Mock).mockReturnValue('output'); // Mock execSync to pass
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Running standard health checks'));
    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(0);
  });

  it('should run critical checks when --critical-only flag is true', async () => {
    (HealthCheckCommand.prototype.parse as jest.Mock).mockResolvedValueOnce({ flags: { 'critical-only': true }, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true);
    (execSync as jest.Mock).mockReturnValue('output');
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Running critical system checks'));
    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(0);
  });

  it('should output JSON when --json flag is true', async () => {
    (HealthCheckCommand.prototype.parse as jest.Mock).mockResolvedValueOnce({ flags: { json: true }, args: {} });
    (existsSync as jest.Mock).mockReturnValue(true);
    (execSync as jest.Mock).mockReturnValue('output');
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(0); },
    }));

    await command.run();

    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('{
  "timestamp":'));
    expect(process.exitCode).toBe(0);
  });

  it('should attempt auto-fix when --fix-issues flag is true and issues are found', async () => {
    (HealthCheckCommand.prototype.parse as jest.Mock).mockResolvedValueOnce({ flags: { 'fix-issues': true }, args: {} });
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

    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Attempting to auto-fix issues'));
    expect(execSync).toHaveBeenCalledWith('npm install', expect.any(Object));
    expect(process.exitCode).toBe(0);
  });

  it('should set exit code to 1 if critical checks fail', async () => {
    (HealthCheckCommand.prototype.parse as jest.Mock).mockResolvedValueOnce({ flags: { 'critical-only': true }, args: {} });
    (existsSync as jest.Mock).mockReturnValue(false); // Simulate critical failure
    (execSync as jest.Mock).mockImplementation(() => { throw new Error('Build failed'); });
    (spawn as jest.Mock).mockImplementation(() => ({
      stdout: { on: (event: string, cb: Function) => { if (event === 'data') cb('Tests: 1 passed'); } },
      stderr: { on: jest.fn() },
      on: (event: string, cb: Function) => { if (event === 'close') cb(1); },
    }));

    await command.run();

    expect(HealthCheckCommand.prototype.log).toHaveBeenCalledWith(expect.stringContaining('NOT READY FOR CLINIC USE'));
    expect(process.exitCode).toBe(1);
  });
});