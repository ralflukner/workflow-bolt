import { TimeProvider } from './context/TimeProvider';
import { PatientProvider } from './context/PatientContext';
import Dashboard from './components/Dashboard';
import AuthProvider from './auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
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
