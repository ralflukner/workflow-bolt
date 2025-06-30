/**
 * App Startup Smoke Tests
 * 
 * These tests serve as sentinel tests to catch basic startup issues early.
 * They focus on fundamental component initialization without complex dependencies.
 */

import { render } from '@testing-library/react';
import { TimeProvider } from '../context/TimeProvider';

describe('App Startup', () => {
  it('can render TimeProvider without runtime errors', () => {
    const errorSpy = jest.spyOn(console, 'error');
    
    // Test the basic TimeProvider can initialize
    expect(() => {
      const { unmount } = render(
        <TimeProvider>
          <div>Test Content</div>
        </TimeProvider>
      );
      unmount();
    }).not.toThrow();
    
    // Check for unexpected console errors
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
        /Mock function/i
      ];
      
      return !allowedPatterns.some(pattern => pattern.test(errorMessage));
    });
    
    if (unexpectedErrors.length > 0) {
      throw new Error(
        `TimeProvider startup failed with unexpected console errors:\n${unexpectedErrors.map(err => err.join(' ')).join('\n')}`
      );
    }
    
    errorSpy.mockRestore();
  });

  it('can render basic components without crashing', () => {
    // Simple smoke test to ensure basic React rendering works
    expect(() => {
      const { container, unmount } = render(<div>Basic App Test</div>);
-      expect(container).toBeInTheDocument();
+      expect(container.textContent).toBe('Basic App Test');
      unmount();
    }).not.toThrow();
  });

  it('can handle provider context creation and cleanup', () => {
    // Test that TimeProvider context creation doesn't cause memory leaks
    expect(() => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <TimeProvider>
            <div>Iteration {i}</div>
          </TimeProvider>
        );
        unmount();
      }
    }).not.toThrow();
  });

  it('detects if core React setup is broken', () => {
    // This test will fail if there are fundamental React setup issues
    // such as mismatched React versions, broken JSX transform, etc.
    const TestComponent = () => {
      return (
        <div data-testid="test-component">
          <span>React is working</span>
          {/* Test basic JSX features */}
          {true && <span>Conditional rendering works</span>}
          {['a', 'b'].map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      );
    };

    expect(() => {
      const { getByTestId, unmount } = render(<TestComponent />);
      expect(getByTestId('test-component')).toBeInTheDocument();
      unmount();
    }).not.toThrow();
  });
});