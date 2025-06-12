// Mock environment variables
process.env = {
  ...process.env,
  REACT_APP_TEBRA_WSDL_URL: 'https://api.tebra.com/wsdl',
  REACT_APP_TEBRA_USERNAME: 'test-user@luknerclinic.com',
  REACT_APP_TEBRA_PASSWORD: 'test-password',
  REACT_APP_TEBRA_CUSTOMERKEY: 'test-customer-key',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
  VITE_TEBRA_PROXY_API_KEY: 'test-proxy-api-key',
  VITE_AUTH0_DOMAIN: 'test-auth0-domain',
  VITE_AUTH0_CLIENT_ID: 'test-auth0-client-id',
  VITE_AUTH0_REDIRECT_URI: 'http://localhost:3000',
  VITE_AUTH0_AUDIENCE: 'test-auth0-audience',
  NODE_ENV: 'test',
};

// Mock window.location (only override reload)
if (typeof window !== 'undefined' && window.location) {
  // @ts-ignore: Jest test setup overriding reload
  window.location.reload = jest.fn();
}

// Mock console.error to avoid noise in test output
console.error = jest.fn();

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
  })
); 