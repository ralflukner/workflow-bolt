/**
 * Jest Mock for Puppeteer
 * Provides minimal mock implementation to allow CLI tests to run
 * without requiring actual browser automation
 */

const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  waitForSelector: jest.fn().mockResolvedValue(undefined),
  click: jest.fn().mockResolvedValue(undefined),
  type: jest.fn().mockResolvedValue(undefined),
  screenshot: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
  evaluate: jest.fn().mockResolvedValue({}),
  close: jest.fn().mockResolvedValue(undefined),
  setDefaultTimeout: jest.fn(),
  setDefaultNavigationTimeout: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  content: jest.fn().mockResolvedValue('<html>Mock Content</html>'),
  url: jest.fn().mockReturnValue('https://mock-url.com'),
  title: jest.fn().mockResolvedValue('Mock Page Title'),
  $: jest.fn().mockResolvedValue(null),
  $$: jest.fn().mockResolvedValue([]),
  waitForTimeout: jest.fn().mockResolvedValue(undefined),
  focus: jest.fn().mockResolvedValue(undefined),
  keyboard: {
    press: jest.fn().mockResolvedValue(undefined),
    type: jest.fn().mockResolvedValue(undefined)
  },
  mouse: {
    click: jest.fn().mockResolvedValue(undefined),
    move: jest.fn().mockResolvedValue(undefined)
  }
};

const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
  pages: jest.fn().mockResolvedValue([mockPage]),
  on: jest.fn(),
  off: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  version: jest.fn().mockResolvedValue('90.0.4430.0'),
  userAgent: jest.fn().mockResolvedValue('Mock UserAgent'),
  wsEndpoint: jest.fn().mockReturnValue('ws://mock-endpoint')
};

const puppeteer = {
  launch: jest.fn().mockResolvedValue(mockBrowser),
  connect: jest.fn().mockResolvedValue(mockBrowser),
  createBrowserFetcher: jest.fn().mockReturnValue({
    download: jest.fn().mockResolvedValue({}),
    canDownload: jest.fn().mockResolvedValue(true),
    localRevisions: jest.fn().mockReturnValue([]),
    remove: jest.fn().mockResolvedValue(undefined)
  }),
  executablePath: jest.fn().mockReturnValue('/mock/chrome/path'),
  defaultArgs: jest.fn().mockReturnValue(['--mock-args']),
  devices: {},
  errors: {
    TimeoutError: class MockTimeoutError extends Error {
      constructor(message) {
        super(message);
        this.name = 'TimeoutError';
      }
    }
  }
};

// Export both default and named exports for compatibility
module.exports = puppeteer;
module.exports.default = puppeteer;
module.exports.Browser = mockBrowser;
module.exports.Page = mockPage;