import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './contexts/firebase';
import { testTebraGetAppointments } from './utils/testTebraAppointments';
import { testTebraGetAppointmentsViaFirebase } from './utils/testTebraViaFirebase';
import { debugFirebaseAuth } from './debug-firebase-auth';

declare global {
  interface Window {
    testTebraGetAppointments: typeof testTebraGetAppointments;
    testTebraViaFirebase: typeof testTebraGetAppointmentsViaFirebase;
    debugFirebaseAuth: typeof debugFirebaseAuth;
    debugAuth0Token: () => void;
  }
}

// Make test functions available globally for console testing
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.testTebraGetAppointments = testTebraGetAppointments;
  window.testTebraViaFirebase = testTebraGetAppointmentsViaFirebase;
  window.debugFirebaseAuth = debugFirebaseAuth;
  window.debugAuth0Token = () => {
    console.log('🔍 To debug Auth0 token, use the useDebugAuth0Token hook in a React component');
    console.log('💡 Or check the browser console for token details during authentication');
  };
  console.log('✅ Tebra test functions loaded:');
  console.log('   - testTebraGetAppointments() for direct SOAP (will fail due to CORS)');
  console.log('   - testTebraViaFirebase() for Firebase Functions proxy (recommended)');
  console.log('   - debugFirebaseAuth() for Firebase authentication debugging');
  console.log('   - debugAuth0Token() for Auth0 token debugging');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>
);
