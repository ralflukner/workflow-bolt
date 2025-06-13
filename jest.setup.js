// Mock environment variables
process.env = {
  ...process.env,
  VITE_TEBRA_WSDL_URL: 'https://api.tebra.com/wsdl',
  VITE_TEBRA_USERNAME: 'test-user@luknerclinic.com',
  VITE_TEBRA_PASSWORD: 'test-password',
  VITE_TEBRA_CUSTOMER_KEY: 'test-customer-key',
  VITE_FIREBASE_API_KEY: 'test-firebase-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project-id',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
  VITE_AUTH0_DOMAIN: 'test-tenant.auth0.com',
  VITE_AUTH0_CLIENT_ID: 'test-client-id',
  VITE_AUTH0_AUDIENCE: 'test-api-identifier',
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