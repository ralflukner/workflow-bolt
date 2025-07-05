import { TimeProvider } from './contexts/TimeProvider';
import { PatientProvider } from './contexts/PatientProvider';
import Dashboard from './components/Dashboard';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import FirebaseAuthSync from './components/FirebaseAuthSync';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FirebaseAuthSync />
        <TimeProvider>
          <PatientProvider>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </PatientProvider>
        </TimeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
