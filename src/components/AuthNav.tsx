import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';

const AuthNav: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <>
          <div className="text-white">
            Welcome, {user?.name || user?.email}
          </div>
          <LogoutButton />
        </>
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default AuthNav; 