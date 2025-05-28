require('@testing-library/jest-dom');
const { cleanup } = require('@testing-library/react');

globalThis.URL.createObjectURL = jest.fn(() => 'mock-url');
globalThis.URL.revokeObjectURL = jest.fn();

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
