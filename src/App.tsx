import { TimeProvider } from './context/TimeProvider';
import { PatientProvider } from './context/PatientContext';
import Dashboard from './components/Dashboard';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';
import FirebaseAuthSync from './components/FirebaseAuthSync';

function App() {
  return (
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
  );
}

export default App;
