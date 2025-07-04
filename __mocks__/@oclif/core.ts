export const mockParse = jest.fn();
export const mockLog = jest.fn();
export const mockError = jest.fn();
export const mockWarn = jest.fn();
export const mockRun = jest.fn();

export class Command {
  parse = mockParse;
  log = mockLog;
  error = mockError;
  warn = mockWarn;
  static flags = {};
  static summary = '';
  static description = '';
  static examples = [];
}

export const Flags = {
  boolean: jest.fn((opts) => opts),
  integer: jest.fn((opts) => opts),
};