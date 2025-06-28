import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useFirebaseAuth } from '../services/authBridge';

/**
 * Component that automatically syncs Auth0 authentication with Firebase
 * This ensures Firebase is authenticated whenever Auth0 is authenticated
 */
export const FirebaseAuthSync: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const { ensureFirebaseAuth } = useFirebaseAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Automatically establish Firebase auth when Auth0 is authenticated
      ensureFirebaseAuth().catch((error) => {
        console.error('Failed to sync Firebase auth:', error);
      });
    }
  }, [isAuthenticated, isLoading, ensureFirebaseAuth]);

  // This component doesn't render anything
  return null;
};

export default FirebaseAuthSync;