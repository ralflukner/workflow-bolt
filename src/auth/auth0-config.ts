export type Auth0Cfg = {
  domain: string;
  clientId: string;
  authorizationParams: {
    redirect_uri: string;
    audience?: string;
    scope?: string;
  };
};

// Browser-safe Auth0 configuration using environment variables
export function getAuth0Config(): Auth0Cfg {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  const scope = import.meta.env.VITE_AUTH0_SCOPE || 'openid profile email';

  if (!domain || !clientId || !redirectUri) {
    throw new Error(
      'Missing required Auth0 configuration. Please ensure VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_REDIRECT_URI are set in your environment variables.'
    );
  }

  return {
    domain,
    clientId,
    authorizationParams: {
      redirect_uri: redirectUri,
      ...(audience && { audience }),
      scope,
    },
  };
}