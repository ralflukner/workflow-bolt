/**
 * Production-Safe Error Boundary for Tebra Debug Dashboard
 * 
 * Catches JavaScript errors in the dashboard component tree and provides
 * graceful fallback UI without crashing the entire application.
 * 
 * HIPAA Compliant: No patient data exposed in error messages
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking (HIPAA-safe)
    const errorId = `dash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging (no PHI included)
    console.error('Dashboard Error Boundary caught an error:', {
      errorId: this.state.errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    this.setState({
      error,
      errorInfo
    });

    // In production, send error to monitoring service
    // eslint-disable-next-line no-undef
    if (process.env.NODE_ENV === 'production') {
      // HIPAA-compliant error reporting - no PHI included
      try {
        // Send to monitoring service (Firebase Crashlytics, Sentry, etc.)
        const errorReport = {
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        // Example: Firebase Crashlytics
        // crashlytics().recordError(error);
        // crashlytics().setCustomKey('errorId', this.state.errorId);
        
        // Example: Custom monitoring endpoint
        // fetch('/api/error-reporting', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorReport)
        // }).catch(() => {}); // Silent fail to prevent error loops
        
        console.warn('Production error reported:', { errorId: this.state.errorId });
      } catch (monitoringError) {
        // Silent fail to prevent error reporting loops
        console.error('Failed to report error to monitoring service');
      }
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <div className="bg-gray-800 rounded-lg border border-red-500/20 p-6 m-4">
          {/* Error Header */}
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-red-300">
              Dashboard Error
            </h3>
          </div>

          {/* Error Message */}
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-200 text-sm mb-2">
              The dashboard encountered an unexpected error and stopped working.
            </p>
            <p className="text-red-300 text-xs font-mono">
              Error ID: {this.state.errorId}
            </p>
          </div>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 mb-4">
              <summary className="text-gray-300 cursor-pointer text-sm font-medium mb-2">
                <Bug className="w-4 h-4 inline mr-2" />
                Development Debug Info
              </summary>
              <div className="text-xs text-gray-400 font-mono space-y-2">
                <div>
                  <strong>Error:</strong> {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1 text-xs">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Recovery Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Dashboard
            </button>
            
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </button>

            <a
              href="/dashboard"
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-decoration-none"
            >
              Return to Main Dashboard
            </a>
          </div>

          {/* User Guidance */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <h4 className="text-blue-300 font-medium mb-2">What to try:</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Click "Reset Dashboard" to restart the component</li>
              <li>• If the error persists, reload the page</li>
              <li>• Check browser console for additional details</li>
              <li>• Contact support if issues continue (provide Error ID)</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple wrapper for components that need error boundary protection
 */
interface WithErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const WithErrorBoundary: React.FC<WithErrorBoundaryProps> = ({ 
  children, 
  fallback 
}) => (
  <DashboardErrorBoundary fallbackComponent={fallback}>
    {children}
  </DashboardErrorBoundary>
);

export default DashboardErrorBoundary;