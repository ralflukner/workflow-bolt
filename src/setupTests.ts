import '@testing-library/jest-dom';

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