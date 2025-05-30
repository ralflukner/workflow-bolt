import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';
import { afterEach, jest, beforeEach } from '@jest/globals';

// Extend Jest's expect with the matchers from jest-dom
expect.extend(matchers);

// Mock timers globally to prevent hanging
jest.useFakeTimers();

// Aggressive test cleanup
beforeEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.runOnlyPendingTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

// Basic Firebase mocks
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

// Mock Firebase config
jest.mock('./config/firebase', () => ({
  db: {},
  auth: {},
  app: {},
  isFirebaseConfigured: false,
  isLocalDevelopment: true,
}));

// Mock import.meta.env
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

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
  writable: true,
});

// Reduce console noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 