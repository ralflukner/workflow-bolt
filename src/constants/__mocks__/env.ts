// Mock Environment Variables for Testing

export const FIREBASE_CONFIG = {
  projectId: 'test-project',
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id',
};

export const AUTH0_CONFIG = {
  domain: 'test-auth0-domain',
  clientId: 'test-auth0-client-id',
  redirectUri: 'http://localhost:3000',
  audience: 'test-auth0-audience',
};

export const TEBRA_CONFIG = {
  proxyApiKey: 'test-proxy-api-key',
};

export const ENV_INFO = {
  nodeEnv: 'test',
  isDev: false,
  isProd: false,
};

export const getEnvVar = (key: string, fallback: string = ''): string => {
  const mockEnv: Record<string, string> = {
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: 'test-app-id',
    VITE_AUTH0_DOMAIN: 'test-auth0-domain',
    VITE_AUTH0_CLIENT_ID: 'test-auth0-client-id',
    VITE_AUTH0_REDIRECT_URI: 'http://localhost:3000',
    VITE_AUTH0_AUDIENCE: 'test-auth0-audience',
    VITE_TEBRA_PROXY_API_KEY: 'test-proxy-api-key',
    NODE_ENV: 'test',
  };
  
  return mockEnv[key] || fallback;
}; 