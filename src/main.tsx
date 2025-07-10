import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { testTebraGetAppointments } from './utils/testTebraAppointments';
import { testPhpDiagnostics } from './utils/testPhpDiagnostics';
import { testAuth0AudienceStandalone } from './test-auth0-audience';

declare global {
  interface Window {
    testTebraGetAppointments: typeof testTebraGetAppointments;
    testPhpDiagnostics: typeof testPhpDiagnostics;
    testAuth0Audience: typeof testAuth0AudienceStandalone;
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
  window.testPhpDiagnostics = testPhpDiagnostics;
  window.testAuth0Audience = testAuth0AudienceStandalone;
  console.log('✅ Tebra test functions loaded:');
  console.log('   - testTebraGetAppointments() for direct SOAP (will fail due to CORS)');
  console.log('   - testPhpDiagnostics() for comprehensive PHP proxy debugging 🔧');
  console.log('   - testAuth0Audience() for Auth0 audience configuration testing 🎯');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
