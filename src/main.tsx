import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseProvider } from './contexts/firebase';
import { testTebraGetAppointments } from './utils/testTebraAppointments';
import { testTebraGetAppointmentsViaFirebase } from './utils/testTebraViaFirebase';

declare global {
  interface Window {
    testTebraGetAppointments: typeof testTebraGetAppointments;
    testTebraViaFirebase: typeof testTebraGetAppointmentsViaFirebase;
  }
}

// Make test functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testTebraGetAppointments = testTebraGetAppointments;
  window.testTebraViaFirebase = testTebraGetAppointmentsViaFirebase;
  console.log('✅ Tebra test functions loaded:');
  console.log('   - testTebraGetAppointments() for direct SOAP (will fail due to CORS)');
  console.log('   - testTebraViaFirebase() for Firebase Functions proxy (recommended)');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </StrictMode>
);
