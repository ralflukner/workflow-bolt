import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

globalThis.URL.createObjectURL = jest.fn(() => 'mock-url');
globalThis.URL.revokeObjectURL = jest.fn();

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
