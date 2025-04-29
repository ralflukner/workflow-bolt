export const AUTH0_CONFIG = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'YOUR_AUTH0_DOMAIN',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'YOUR_AUTH0_CLIENT_ID',
  redirectUri: import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || 'https://api.patientflow.com',
  scope: 'openid profile email'
}; 