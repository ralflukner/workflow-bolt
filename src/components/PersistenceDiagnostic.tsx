import React, { Component } from 'react';
import { withContexts, WithContextsProps } from './withContexts';
import { Database, Clock, Save, AlertCircle } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { isFirebaseConfigured, auth } from '../config/firebase';

interface State {
  lastSaveTime: Date | null;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  storageType: string;
  authStatus: string;
  isAuthenticated: boolean;
}

class PersistenceDiagnosticClass extends Component<WithContextsProps, State> {
  private authCheckInterval: NodeJS.Timeout | null = null;
  private saveSuccessTimer: NodeJS.Timeout | null = null;
  private saveIdleTimer: NodeJS.Timeout | null = null;

  constructor(props: WithContextsProps) {
    super(props);

    this.state = {
      lastSaveTime: null,
      saveStatus: 'idle',
      storageType: 'unknown',
      authStatus: 'checking',
      isAuthenticated: false,
    };
  }

  componentDidMount() {
    this.checkAuthStatus();
    this.authCheckInterval = setInterval(() => this.checkAuthStatus(), 5000);
  }

  componentDidUpdate(prevProps: WithContextsProps) {
    const { patients, persistenceEnabled, hasRealData } = this.props.patientContext;
    const prevPatients = prevProps.patientContext.patients;
    const prevPersistenceEnabled = prevProps.patientContext.persistenceEnabled;
    const prevHasRealData = prevProps.patientContext.hasRealData;

    // Track when saves happen - equivalent to useEffect dependency array
    if (
      (patients.length > 0 && persistenceEnabled && hasRealData) &&
      (patients.length !== prevPatients.length || 
       persistenceEnabled !== prevPersistenceEnabled || 
       hasRealData !== prevHasRealData)
    ) {
      this.handleSaveStateChange();
    }
  }

  componentWillUnmount() {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
    if (this.saveSuccessTimer) {
      clearTimeout(this.saveSuccessTimer);
    }
    if (this.saveIdleTimer) {
      clearTimeout(this.saveIdleTimer);
    }
  }

  checkAuthStatus = async () => {
    try {
      const firebaseConfigured = isFirebaseConfigured();
      const firebaseUser = auth?.currentUser;
      
      if (!this.state.isAuthenticated) {
        this.setState({
          authStatus: 'No Auth0 login',
          storageType: 'localStorage (no auth)'
        });
      } else if (!firebaseConfigured) {
        this.setState({
          authStatus: 'Firebase not configured',
          storageType: 'localStorage (no Firebase)'
        });
      } else if (!firebaseUser) {
        this.setState({
          authStatus: 'Firebase auth failed',
          storageType: 'localStorage (auth fallback)'
        });
      } else {
        this.setState({
          authStatus: 'Authenticated',
          storageType: 'Firebase'
        });
      }
    } catch (error) {
      console.error('Error checking authentication status:', error);
      this.setState({
        authStatus: 'Error checking status',
        storageType: 'unknown'
      });
    }
  };

  handleSaveStateChange = () => {
    this.setState({
      saveStatus: 'saving',
      lastSaveTime: new Date()
    });

    this.saveSuccessTimer = setTimeout(() => {
      this.setState({ saveStatus: 'success' });
      this.saveIdleTimer = setTimeout(() => {
        this.setState({ saveStatus: 'idle' });
      }, 2000);
    }, 500);
  };

  formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  render() {
    const { patientContext, timeContext } = this.props;
    const { patients, persistenceEnabled, hasRealData, tickCounter } = patientContext;
    const { getCurrentTime } = timeContext;
    const { lastSaveTime, saveStatus, authStatus, storageType } = this.state;

    return (
      <div className="bg-gray-800 rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <Database className="mr-2" size={20} />
          Persistence Diagnostic
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Persistence Enabled:</span>
            <span className={persistenceEnabled ? 'text-green-400' : 'text-red-400'}>
              {persistenceEnabled ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Has Real Data:</span>
            <span className={hasRealData ? 'text-green-400' : 'text-yellow-400'}>
              {hasRealData ? 'Yes' : 'No (Mock Data)'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Patient Count:</span>
            <span className="text-white">{patients.length}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Tick Counter:</span>
            <span className="text-white">{tickCounter}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Current Time:</span>
            <span className="text-white">{getCurrentTime().toLocaleTimeString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Last Save:</span>
            <span className="text-white flex items-center">
              {this.formatTime(lastSaveTime)}
              {saveStatus === 'saving' && <Save className="ml-2 text-blue-400 animate-pulse" size={16} />}
              {saveStatus === 'success' && <Clock className="ml-2 text-green-400" size={16} />}
              {saveStatus === 'error' && <AlertCircle className="ml-2 text-red-400" size={16} />}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Auth Status:</span>
            <span className={authStatus === 'Authenticated' ? 'text-green-400' : 'text-yellow-400'}>
              {authStatus}
            </span>
          </div>
          
          <div className="mt-3 p-2 bg-gray-700 rounded text-xs">
            <div className="text-gray-300">
              Auto-save: Every 2 seconds when data changes<br />
              Periodic save: Every 5 minutes in real-time mode<br />
              Current Storage: {storageType}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Create a wrapper to handle Auth0 hook since we can't use hooks in class components
const PersistenceDiagnosticWithAuth: React.FC = () => {
  const { isAuthenticated } = useAuth0();
  
  // Create enhanced context that includes auth state
  const EnhancedComponent = withContexts(PersistenceDiagnosticClass);
  
  // Pass auth state through a ref or use a different pattern
  // For now, we'll create a ref to update the component
  const componentRef = React.useRef<PersistenceDiagnosticClass>(null);
  
  React.useEffect(() => {
    if (componentRef.current) {
      componentRef.current.setState({ isAuthenticated });
    }
  }, [isAuthenticated]);

  return <EnhancedComponent ref={componentRef} />;
};

export const PersistenceDiagnostic = PersistenceDiagnosticWithAuth;