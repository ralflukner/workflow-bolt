// Mock import.meta.env for Jest tests
const requiredVars = [
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const env = {};
requiredVars.forEach((key) => {
  env[key] = process.env[key];
});

// Provide NODE_ENV flags similar to Vite
env.NODE_ENV = process.env.NODE_ENV || 'test';
env.DEV = env.NODE_ENV !== 'production';
env.PROD = env.NODE_ENV === 'production';

global.import = { meta: { env } }; 