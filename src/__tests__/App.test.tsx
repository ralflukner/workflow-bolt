/**
 * App Startup Smoke Tests
 * 
 * These tests verify that the App component can render without runtime errors.
 * This serves as a sentinel test to catch startup issues early.
 */

import { render } from '@testing-library/react';
import App from '../App';

// Temporarily disable console error detection for this test file
// since we want to manually control error handling here
const originalConsoleError = console.error;

describe('App Startup', () => {
  beforeEach(() => {
    // Reset console.error for each test
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  it('renders App without runtime errors', () => {
    const errorSpy = jest.spyOn(console, 'error');
    
    // This should not throw any errors during render
    expect(() => {
      render(<App />);
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
        /Auth0Provider was called outside of the Auth0Context/i,
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

  it('renders App with all required providers', () => {
    const { container } = render(<App />);
    
    // Verify that the component tree rendered successfully
    expect(container).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it('handles provider initialization gracefully', () => {
    // This test ensures that provider setup doesn't cause crashes
    // even if some external services are unavailable
    expect(() => {
      const { unmount } = render(<App />);
      unmount(); // Test cleanup as well
    }).not.toThrow();
  });
});