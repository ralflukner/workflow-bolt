import { useQuery } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { useFirebaseAuth } from '../services/authBridge';

/**
 * Component that automatically syncs Auth0 authentication with Firebase
 * This ensures Firebase is authenticated whenever Auth0 is authenticated
 */
export const FirebaseAuthSync: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const { ensureFirebaseAuth } = useFirebaseAuth();

  // Use React Query for Firebase auth sync instead of useEffect
  useQuery({
    queryKey: ['firebaseAuthSync', isAuthenticated, isLoading],
    queryFn: async () => {
      if (!isLoading && isAuthenticated) {
        try {
          await ensureFirebaseAuth();
          return { success: true };
        } catch (error) {
          console.error('Failed to sync Firebase auth:', error);
          throw error;
        }
      }
      return { success: false, reason: 'Not authenticated or still loading' };
    },
    enabled: !isLoading && isAuthenticated,
    retry: 2,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // This component doesn't render anything
  return null;
};

export default FirebaseAuthSync;