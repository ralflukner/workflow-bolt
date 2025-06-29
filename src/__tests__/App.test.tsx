/**
 * App Startup Smoke Tests
 * 
 * These tests verify that core App components can initialize without runtime errors.
 * This serves as a sentinel test to catch startup issues early.
 */

import { render } from '@testing-library/react';
import { TimeProvider } from '../context/TimeProvider';
import { PatientProvider } from '../context/PatientContext';
import Dashboard from '../components/Dashboard';

// Mock Auth0 to avoid secure origin requirements in tests
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: 'test-user', email: 'test@example.com' },
    loginWithRedirect: jest.fn(),
    logout: jest.fn()
  }),
  Auth0Provider: ({ children }: any) => children
}));

// Mock Firebase Auth Sync component
jest.mock('../components/FirebaseAuthSync', () => {
  return function MockFirebaseAuthSync() {
    return null;
  };
});

// Mock Protected Route component to always render children
jest.mock('../components/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: any) {
    return children;
  };
});

describe('App Startup', () => {
  it('renders core application components without runtime errors', () => {
    const errorSpy = jest.spyOn(console, 'error');
    
    // Test the core component hierarchy without Auth0Provider complications
    expect(() => {
      render(
        <TimeProvider>
          <PatientProvider>
            <Dashboard />
          </PatientProvider>
        </TimeProvider>
      );
    }).not.toThrow();
    
    // Check that no unexpected console.error calls occurred
    const errorCalls = errorSpy.mock.calls;
    const unexpectedErrors = errorCalls.filter(call => {
      const errorMessage = call.join(' ');
      
      // Allow certain expected warnings/errors
      const allowedPatterns = [
        /Not wrapped in act/i,
        /Warning: ReactDOM.render is no longer supported/i,
        /Warning: validateDOMNesting/i,
        /Warning: Function components cannot be given refs/i,
        /Warning: Can't perform a React state update on an unmounted component/i,
        /Mock function/i,
        /Firebase: No Firebase App/i
      ];
      
      return !allowedPatterns.some(pattern => pattern.test(errorMessage));
    });
    
    if (unexpectedErrors.length > 0) {
      throw new Error(
        `App startup failed with unexpected console errors:\n${unexpectedErrors.map(err => err.join(' ')).join('\n')}`
      );
    }
    
    errorSpy.mockRestore();
  });

  it('renders Dashboard with all required providers', () => {
    const { container } = render(
      <TimeProvider>
        <PatientProvider>
          <Dashboard />
        </PatientProvider>
      </TimeProvider>
    );
    
    // Verify that the component tree rendered successfully
    expect(container).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it('handles provider initialization and cleanup gracefully', () => {
    // This test ensures that provider setup doesn't cause crashes
    // even if some external services are unavailable
    expect(() => {
      const { unmount } = render(
        <TimeProvider>
          <PatientProvider>
            <Dashboard />
          </PatientProvider>
        </TimeProvider>
      );
      unmount(); // Test cleanup as well
    }).not.toThrow();
  });

  it('can render individual providers without errors', () => {
    // Test TimeProvider independently
    expect(() => {
      const { unmount: unmountTime } = render(
        <TimeProvider>
          <div>Test Time Provider</div>
        </TimeProvider>
      );
      unmountTime();
    }).not.toThrow();

    // Test PatientProvider independently  
    expect(() => {
      const { unmount: unmountPatient } = render(
        <TimeProvider>
          <PatientProvider>
            <div>Test Patient Provider</div>
          </PatientProvider>
        </TimeProvider>
      );
      unmountPatient();
    }).not.toThrow();
  });
});