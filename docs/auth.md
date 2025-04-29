# Authentication

This document explains the Auth0 authentication implementation in the Patient Flow Management application.

## Overview

The application uses Auth0 for authentication, providing a secure, standards-based, and feature-rich authentication solution.

## Configuration

Authentication is configured in `src/auth/auth0-config.ts`. You'll need to replace the placeholder values with your actual Auth0 application settings:

```typescript
export const AUTH0_CONFIG = {
  domain: 'YOUR_AUTH0_DOMAIN', // e.g., 'dev-abc123.us.auth0.com'
  clientId: 'YOUR_AUTH0_CLIENT_ID',
  redirectUri: window.location.origin,
  audience: 'https://api.patientflow.com', // Optional: API identifier (if you have a backend)
  scope: 'openid profile email'
};
```

## Setting Up Auth0

1. **Create an Auth0 Account and Application**:
   - Sign up at [Auth0.com](https://auth0.com/)
   - Create a new Application (choose Single Page Application)
   - Configure the Allowed Callback URLs, Logout URLs, and Web Origins to match your application URL

2. **Update Configuration**:
   - Copy your Auth0 Domain and Client ID from the Auth0 Dashboard
   - Update the values in `src/auth/auth0-config.ts`

## Authentication Components

### Auth Provider

The `AuthProvider` component wraps the entire application to provide authentication context:

```typescript
// src/auth/AuthProvider.tsx
import { Auth0Provider } from '@auth0/auth0-react';
// ...
```

### Login and Logout Buttons

Simple components for triggering authentication:

```typescript
// src/components/LoginButton.tsx
import { useAuth0 } from '@auth0/auth0-react';
// ...
```

```typescript
// src/components/LogoutButton.tsx
import { useAuth0 } from '@auth0/auth0-react';
// ...
```

### Protected Route

The `ProtectedRoute` component ensures content is only accessible to authenticated users:

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth0 } from '@auth0/auth0-react';
// ...
```

## User Authentication Flow

1. User navigates to the application
2. The `ProtectedRoute` component checks authentication status
3. If not authenticated, the login page is shown
4. User clicks the Login button and is redirected to Auth0
5. After successful authentication, Auth0 redirects back to the application
6. The application displays the Dashboard with AuthNav showing the user's info

## Accessing User Information

You can access authentication state and user information using the `useAuth0` hook:

```typescript
import { useAuth0 } from '@auth0/auth0-react';

function MyComponent() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  
  // Use authentication information in your component
}
```

## Custom Claims and Roles

For more advanced use cases, you can configure Auth0 to include custom claims and roles in the user token.

## Security Considerations

- The application uses Auth0's recommended security practices
- User credentials are never stored in the application
- Authentication tokens are handled securely through Auth0's SDK
- The application uses HTTPS for all communications

## Troubleshooting

**Common Issues**:

1. **Redirect URI Mismatch**: Ensure the redirectUri in your Auth0 config matches your application's URL
2. **Invalid Client ID or Domain**: Double-check your Auth0 application settings
3. **CORS Errors**: Verify your Auth0 application's Allowed Web Origins includes your development URL 