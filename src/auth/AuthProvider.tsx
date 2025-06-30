import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { getAuth0Config, Auth0Cfg } from './auth0-config';
import { useAuth0 } from '@auth0/auth0-react';

interface AuthProviderProps {
  children: React.ReactNode;
}

interface AppState {
  returnTo?: string;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  let config: Auth0Cfg | null = null;
  let error: Error | null = null;

  try {
    config = getAuth0Config();
  } catch (err) {
    error = err instanceof Error ? err : new Error('Failed to load Auth0 configuration');
  }

  const onRedirectCallback = (appState: AppState | undefined) => {
    window.history.replaceState(
      {},
      document.title,
      appState?.returnTo || window.location.pathname
    );
  };

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-white mb-4">Configuration Error</h1>
        <p className="text-gray-300 mb-6">{error?.message || 'Failed to load Auth0 configuration'}</p>
        <div className="text-sm text-gray-400 max-w-2xl">
          <p className="mb-2">To fix this issue:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Create a <code className="bg-gray-800 px-1 rounded">.env</code> file in your project root</li>
            <li>Add the following variables:</li>
          </ol>
          <pre className="bg-gray-800 p-3 rounded mt-2 text-xs">
{`VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:3000
VITE_AUTH0_AUDIENCE=your-api-audience (optional)
VITE_AUTH0_SCOPE=openid profile email (optional)`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={config.authorizationParams}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
    >
      {/* Dev-only helpers to inspect Auth0 tokens from the browser console */}
      {import.meta.env.DEV && (
        <DevHelpers />
      )}
      {children}
    </Auth0Provider>
  );
};

/* ------------------------------------------------------------------
   DevHelpers – attaches getToken() and loginPopup() shortcuts to window
   so you can analyse the Auth0 token from the browser console.
   Removed automatically in production builds.                      
-------------------------------------------------------------------*/
const DevHelpers: React.FC = () => {
  const { getAccessTokenSilently, loginWithPopup } = useAuth0();

  // Set up dev helpers immediately without useEffect
  React.useMemo(() => {
    (window as unknown as Record<string, unknown>).getToken = () => getAccessTokenSilently();
    (window as unknown as Record<string, unknown>).loginPopup = () => loginWithPopup();
    console.log('🔧 Dev helpers available: getToken() • loginPopup()');
  }, [getAccessTokenSilently, loginWithPopup]);

  // Cleanup pattern using ref callback (runs on unmount without useEffect)
  const cleanupCallbackRef = React.useCallback((node: HTMLElement | null) => {
    // This callback runs when the ref is attached/detached
    if (node === null) {
      // Component is unmounting - clean up window properties
      delete (window as unknown as Record<string, unknown>).getToken;
      delete (window as unknown as Record<string, unknown>).loginPopup;
      console.log('🧹 Dev helpers cleaned up on unmount');
    }
  }, []);

  // Hidden div that triggers cleanup on unmount via ref callback
  return <div ref={cleanupCallbackRef} style={{ display: 'none' }} />;
};

export default AuthProvider; 