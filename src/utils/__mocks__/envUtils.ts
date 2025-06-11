// Mock implementation of envUtils for Jest tests

export const getEnvVar = (name: string): string | undefined => {
  // Use process.env in tests
  return process.env[name];
};

export const checkFirebaseEnvVars = (): { loaded: string[]; missing: string[] } => {
  const requiredVars = [
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const loaded = requiredVars.filter(varName => {
    const value = process.env[varName];
    return value && value !== 'undefined';
  });

  const missing = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value === 'undefined';
  });

  return { loaded, missing };
};