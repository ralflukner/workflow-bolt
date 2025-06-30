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

// Mock import.meta.env and process.env
const mockEnv = {
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
  VITE_TEBRA_CUSTKEY: 'test-custkey',
  VITE_TEBRA_WSDL_URL: 'https://test-wsdl-url.com',
  VITE_TEBRA_USERNAME: 'test-user',
  VITE_TEBRA_PASSWORD: 'test-password',
};

Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: mockEnv,
    },
  },
  writable: true,
});

Object.assign(process.env, mockEnv);

// Mock window.confirm only if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'confirm', {
    value: jest.fn(() => true),
    writable: true,
  });
}

// Console error detection to catch React errors during testing
// Currently disabled while debugging test timeouts - will re-enable after resolving issues
let consoleErrorSpy: jest.MockedFunction<typeof console.error> | undefined;

beforeEach(() => {
  // Disabled temporarily due to test timeouts
  // TODO: Re-enable once test stability issues are resolved
  /*
  // Clear any previous spy
  if (consoleErrorSpy) {
    consoleErrorSpy.mockRestore();
  }
  
  // Set up spy to catch console.error calls
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    const errorMessage = args.join(' ');
    
    // Allow certain expected errors to pass through silently
    const allowedErrors = [
      /Not wrapped in act/i,
      /Warning: ReactDOM.render is no longer supported/i,
      /Warning: validateDOMNesting/i,
      /Warning: Function components cannot be given refs/i,
      /Warning: Can't perform a React state update on an unmounted component/i,
      // Add other expected warnings/errors as needed
    ];
    
    const isAllowedError = allowedErrors.some(pattern => pattern.test(errorMessage));
    
    if (!isAllowedError) {
      // Log error for debugging but don't fail the test yet
      console.warn(`Detected unexpected console.error: ${errorMessage}`);
      // TODO: Change to throw error once patterns are refined
      // throw new Error(`Unexpected console.error during test execution:\n${errorMessage}`);
    }
  });
  */
});

afterEach(() => {
  // Clean up spy
  if (consoleErrorSpy) {
    consoleErrorSpy.mockRestore();
  }
});

// Reduce console noise for non-error output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  // Don't mock error here since we're handling it above
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