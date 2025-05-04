// First, attempt to get values from environment variables
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const redirectUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Check if critical values are missing
if (!domain || !clientId) {
  throw new Error('Missing required Auth0 configuration. Check environment variables.');
}

// Only if validation passes, create and export the config
export const AUTH0_CONFIG = {
  domain,
  clientId,
  redirectUri,
  audience,
  scope: 'openid profile email'
};