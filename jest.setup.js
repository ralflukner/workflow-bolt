// Mock environment variables
process.env = {
  ...process.env,
  REACT_APP_TEBRA_WSDL_URL: 'https://api.tebra.com/wsdl',
  REACT_APP_TEBRA_USERNAME: 'test-user',
  REACT_APP_TEBRA_PASSWORD: 'test-pass',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
};

// Mock window.location (only override reload)
if (typeof window !== 'undefined' && window.location) {
  // Only stub reload if it is not already mocked
  if (!('reload' in window.location)) {
    Object.defineProperty(window.location, 'reload', {
      configurable: true,
      value: jest.fn(),
    });
  } else {
    // @ts-ignore: Jest test setup overriding reload
    window.location.reload = jest.fn();
  }
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