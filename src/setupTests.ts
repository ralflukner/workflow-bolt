import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, afterAll, jest, beforeEach } from '@jest/globals';

// Determine if we are running real API tests (Firebase should not be mocked)
const isRealApiRun = process.env.RUN_REAL_API_TESTS === 'true';

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

// Mock URL APIs
globalThis.URL.createObjectURL = jest.fn(() => 'mock-url');
globalThis.URL.revokeObjectURL = jest.fn();

// Mock Firebase config
if (!isRealApiRun) {
  jest.mock('./config/firebase', () => ({
    db: {},
    auth: {},
    app: {},
    functions: {},
    analytics: {},
    isFirebaseConfigured: jest.fn(() => false),
    initializeFirebase: jest.fn(),
    getFirebaseServices: jest.fn(),
    isLocalDevelopment: true,
  }));
}

// Note: secretsService is mocked via moduleNameMapper in jest.config.cjs

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
        VITE_TEBRA_PROXY_API_KEY: 'test-proxy-api-key',
        VITE_AUTH0_DOMAIN: 'test-auth0-domain',
        VITE_AUTH0_CLIENT_ID: 'test-auth0-client-id',
        VITE_AUTH0_REDIRECT_URI: 'http://localhost:3000',
        VITE_AUTH0_AUDIENCE: 'test-auth0-audience',
        NODE_ENV: 'test',
        DEV: false,
        PROD: false,
      },
    },
  },
  writable: true,
});

// Mock window.confirm only if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'confirm', {
    value: jest.fn(() => true),
    writable: true,
  });
}

// Reduce console noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// ---------------------------------------------------------------------------
// Firebase mocks (disabled when RUN_REAL_API_TESTS=true)
// ---------------------------------------------------------------------------

if (!isRealApiRun) {
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
    onAuthStateChanged: jest.fn(),
    signInWithCustomToken: jest.fn(),
  }));
}

if (!isRealApiRun) {
  jest.mock('./config/firebase', () => ({
    db: {},
    auth: {},
    app: {},
    functions: {},
    analytics: {},
    isFirebaseConfigured: jest.fn(() => false),
    initializeFirebase: jest.fn(),
    getFirebaseServices: jest.fn(),
    isLocalDevelopment: true,
  }));
} 