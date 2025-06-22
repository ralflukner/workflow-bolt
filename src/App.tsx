import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimeProvider } from './context/TimeProvider';
import { PatientProvider } from './context/PatientContext';
import Dashboard from './components/Dashboard';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TimeProvider>
          <PatientProvider>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </PatientProvider>
        </TimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
