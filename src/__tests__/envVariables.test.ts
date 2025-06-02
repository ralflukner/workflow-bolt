import { describe, it, expect } from '@jest/globals';

// List the environment variables that must be present for the app to work
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

describe('Environment variables', () => {
  for (const key of REQUIRED_ENV_VARS) {
    it(`${key} should be defined`, () => {
      // `import.meta.env` is populated in setupJestEnv.js
      // Fallback to process.env if the helper did not inject it
      const value = (global as any).import?.meta?.env?.[key] ?? process.env[key];
      expect(value).toBeDefined();
      expect(value).not.toBe('');
    });
  }
}); 