import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { AUTH0_CONFIG } from './auth0-config';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AppState {
  returnTo?: string;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const onRedirectCallback = (appState: AppState | undefined) => {
    window.history.replaceState(
      {},
      document.title,
      appState?.returnTo || window.location.pathname
    );
  };

  return (
    <Auth0Provider
      domain={AUTH0_CONFIG.domain}
      clientId={AUTH0_CONFIG.clientId}
      authorizationParams={{
        redirect_uri: AUTH0_CONFIG.redirectUri,
        audience: AUTH0_CONFIG.audience,
        scope: AUTH0_CONFIG.scope
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider; 