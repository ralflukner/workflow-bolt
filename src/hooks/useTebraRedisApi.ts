import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { tebraRedisApi } from '../services/tebraRedisApi';

export const useTebraRedisApi = () => {
  const { getAccessTokenSilently, user } = useAuth0();

  useEffect(() => {
    // Initialize the API with Auth0 token provider
    tebraRedisApi.initialize(
      () => getAccessTokenSilently(),
      () => user?.sub
    );

    // Cleanup on unmount
    return () => {
      tebraRedisApi.dispose();
    };
  }, [getAccessTokenSilently, user]);

  return tebraRedisApi;
}; 