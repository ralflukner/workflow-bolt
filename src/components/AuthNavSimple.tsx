import React from 'react';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';

interface AuthNavProps {
  isAuthenticated?: boolean;
  isLoading?: boolean;
  user?: {
    name?: string;
    email?: string;
  } | null;
}

const AuthNavSimple: React.FC<AuthNavProps> = ({
  isAuthenticated = false,
  isLoading = false,
  user = null
}) => {
  if (isLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="flex items-center space-x-4">
      {isAuthenticated ? (
        <>
          <div className="text-white">
            Welcome, {user?.name || user?.email || 'User'}
          </div>
          <LogoutButton />
        </>
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default AuthNavSimple;