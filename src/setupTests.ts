import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { afterEach, jest } from '@jest/globals';

// Extend Jest's expect with the matchers from jest-dom
expect.extend(matchers);

// Global test suite timeout - fail any remaining tests after 4 minutes
const GLOBAL_TIMEOUT = 240000; // 4 minutes in milliseconds
let globalTimeoutId: NodeJS.Timeout;

beforeAll(() => {
  globalTimeoutId = setTimeout(() => {
    console.error('⏰ GLOBAL TIMEOUT: Test suite exceeded 4 minutes, forcing exit...');
    process.exit(1);
  }, GLOBAL_TIMEOUT);
});

afterAll(() => {
  if (globalTimeoutId) {
    clearTimeout(globalTimeoutId);
  }
});

// Mock Firebase modules to prevent initialization errors in tests
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: 1640995200, nanoseconds: 0 })),
  },
  writeBatch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn(),
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
}));

// Mock URL APIs
globalThis.URL.createObjectURL = jest.fn(() => 'mock-url');
globalThis.URL.revokeObjectURL = jest.fn();

// Clean up after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock Firebase modules
jest.mock('./config/firebase', () => ({
  db: {},
  auth: {},
  app: {},
  isFirebaseConfigured: false,
  isLocalDevelopment: true,
}));

// Mock the time context hooks
jest.mock('./hooks/useTimeContext', () => ({
  useTimeContext: () => ({
    timeMode: { simulated: false, currentTime: new Date().toISOString() },
    setTimeMode: jest.fn(),
    getCurrentTime: () => new Date(),
    formatDateTime: (date: Date) => date.toLocaleString(),
    resetTime: jest.fn(),
  }),
}));

// Mock import.meta.env for Jest
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_FIREBASE_PROJECT_ID: 'demo-project',
        VITE_FIREBASE_API_KEY: 'demo-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'demo-project.firebaseapp.com',
        VITE_FIREBASE_STORAGE_BUCKET: 'demo-project.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: 'demo-app-id',
      },
    },
  },
  writable: true,
});

// Mock window.confirm for tests
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 