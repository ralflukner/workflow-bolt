import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (error) {
    console.error('Auth0 Error:', error);
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-gray-300 mb-6">{error.message}</p>
        <LoginButton />
      </div>
    );
  }

  if (isLoading) {
    console.log('Auth0 Loading State:', { isAuthenticated, isLoading });
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
        <p className="text-gray-300 mb-6">Please log in to access the Patient Flow Management system.</p>
        <LoginButton />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 