import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { AUTH0_CONFIG } from './auth0-config';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  return (
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      authorizationParams={{
        redirect_uri: AUTH0_CONFIG.redirectUri,
        audience: AUTH0_CONFIG.audience,
        scope: AUTH0_CONFIG.scope
      }}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider; 