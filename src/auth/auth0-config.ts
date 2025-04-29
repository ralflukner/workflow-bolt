export const AUTH0_CONFIG = {
  domain: 'YOUR_AUTH0_DOMAIN', // e.g., 'dev-abc123.us.auth0.com'
  clientId: 'YOUR_AUTH0_CLIENT_ID',
  redirectUri: window.location.origin,
  audience: 'https://api.patientflow.com', // Optional: API identifier (if you have a backend)
  scope: 'openid profile email'
}; 