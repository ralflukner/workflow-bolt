// First, attempt to get values from environment variables
import { AUTH0_CONFIG as AUTH0_ENV } from '../constants/env';

const domain = AUTH0_ENV.domain;
const clientId = AUTH0_ENV.clientId;
const redirectUri = AUTH0_ENV.redirectUri || (typeof window !== 'undefined' ? window.location.origin : '');
const audience = AUTH0_ENV.audience;

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