import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './contexts/firebase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testTebraGetAppointments } from './utils/testTebraAppointments';
import { testTebraGetAppointmentsViaFirebase } from './utils/testTebraViaFirebase';
import { debugFirebaseAuth } from './debug-firebase-auth';
import { decodeAuth0Token } from './test-auth0-token';
import { useTestAuth0Audience } from './test-auth0-audience';

declare global {
  interface Window {
    testTebraGetAppointments: typeof testTebraGetAppointments;
    testTebraViaFirebase: typeof testTebraGetAppointmentsViaFirebase;
    debugFirebaseAuth: typeof debugFirebaseAuth;
    decodeAuth0Token: typeof decodeAuth0Token;
  }
}

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Make test functions available globally for console testing
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.testTebraGetAppointments = testTebraGetAppointments;
  window.testTebraViaFirebase = testTebraGetAppointmentsViaFirebase;
  window.debugFirebaseAuth = debugFirebaseAuth;
  window.decodeAuth0Token = decodeAuth0Token;
  console.log('✅ Tebra test functions loaded:');
  console.log('   - testTebraGetAppointments() for direct SOAP (will fail due to CORS)');
  console.log('   - testTebraViaFirebase() for Firebase Functions proxy (recommended)');
  console.log('   - debugFirebaseAuth() for Firebase authentication debugging');
  console.log('   - decodeAuth0Token(token) for Auth0 token analysis');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </QueryClientProvider>
  </StrictMode>
);
