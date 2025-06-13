
# EHR Authentication & Data Retrieval Feature

## 1. Overview

This document outlines the implementation and testing of the enhanced authentication bridge (`AuthBridge`) and the `useFirebaseAuth` hook. This system is responsible for managing secure authentication between the application, Auth0, and Firebase, with a focus on robust token exchange, refresh mechanisms, and comprehensive debugging capabilities, particularly for retrieving patient schedule data from the EHR.

The core goals of this feature are:

- Securely exchange Auth0 access tokens for Firebase custom tokens.

- Implement a reliable token refresh mechanism, handling silent refresh and fallback to interactive methods (popup).

- Provide client-side caching for Firebase tokens to improve performance and reduce redundant exchanges.

- Incorporate resilient retry logic for network-dependent operations.

- Offer extensive debugging tools and a health check system for diagnostics and troubleshooting.

## 2. Key Features

### 2.1. Advanced Token Exchange (`AuthBridge.exchangeTokens`)

- Validates Auth0 token format and expiry before attempting an exchange.

- Communicates with a Firebase Cloud Function (`exchangeAuth0Token`) to securely swap the Auth0 token for a Firebase custom token.

- Includes retry logic with exponential backoff for the exchange process.

### 2.2. Token Caching (`AuthBridge`)

- **Client-Side Caching**: Successfully exchanged Firebase tokens are cached client-side to minimize repeated calls to the token exchange function.

- **Cache Key**: A hash of the Auth0 token is used as the cache key.

- **Cache Expiry**: Firebase custom tokens are valid for 1 hour. The cache stores tokens for 55 minutes to provide a safety buffer, ensuring tokens are refreshed before actual expiry.

- **Automatic Pruning**: Expired entries are automatically removed from the cache upon access attempt.

- **Manual Clearing**: `clearTokenCache()` method is available for manual cache invalidation during logout or for debugging.

### 2.3. Retry Mechanism (`AuthBridge.withRetry`)

- A generic retry wrapper with exponential backoff and a maximum retry limit.

- Applied to critical asynchronous operations:
    - Token exchange via Firebase Functions (`exchangeTokens`).
    - Firebase sign-in with custom token (`signInWithAuth0Token`).

- Configurable `maxRetries`, `baseDelay`, and `maxDelay`.

### 2.4. Debugging and Logging (`AuthBridge` & `useFirebaseAuth`)

- **Structured Logging (`AuthBridge.logDebug`)**: All significant events, errors, and state changes within `AuthBridge` are logged with timestamps and contextual data. This method is public for use by associated hooks or components.

- **Debug Information (`AuthBridge.getDebugInfo`)**: Provides a snapshot of the authentication system's state:
    - Recent debug log entries (last 20).
    - Current cache size.
    - Details of cached entries (UID, expiry time, time remaining).

- **Access via Hook**: `useFirebaseAuth` exposes `getDebugInfo()` and `clearCache()` for easy access from UI components or developer tools.

### 2.5. Health Check (`AuthBridge.healthCheck`)

- An asynchronous method that assesses the health of the authentication components:
    - Availability of Firebase Auth and Functions services.
    - Status of the current Firebase user.
    - Initialization of the token exchange Firebase Function.

- Returns a status (`healthy`, `degraded`, `unhealthy`) and detailed check results.

- Accessible via `useFirebaseAuth().healthCheck()`.

### 2.6. Enhanced `useFirebaseAuth` Hook

- **`ensureFirebaseAuth(forceRefresh = false)`**:
    - Orchestrates the entire authentication flow.
    - Retrieves Auth0 token using `getAccessTokenSilently`.
    - Implements a fallback to `getAccessTokenWithPopup` if silent refresh fails.
    - Calls `authBridge.signInWithAuth0Token` to sign into Firebase.
    - `forceRefresh` parameter (defaults to `false`) can be set to `true` to bypass Auth0's cache and force a new token from the Auth0 server.

- **`refreshToken()`**: A convenience method that calls `ensureFirebaseAuth(true)` to explicitly refresh tokens.

- Exposes debugging utilities: `getDebugInfo`, `clearCache`, and `healthCheck`.

## 3. Implementation Details

### 3.1. `AuthBridge.ts`

- **Singleton Pattern**: Ensures a single instance manages the authentication state.

- **Token Validation**: `validateAuth0Token` checks JWT format and `exp` claim.

- **Caching Logic**: `getCachedToken` and `cacheToken` manage the `Map`-based token cache.

- **Firebase Interaction**: Uses `httpsCallable` for `exchangeAuth0Token` and `signInWithCustomToken` for Firebase auth.

- **Error Handling**: Robust try-catch blocks with detailed logging for all critical operations.

### 3.2. `useFirebaseAuth` Hook

- Integrates `AuthBridge` with the React application lifecycle and Auth0 React SDK.

- Handles the logic for obtaining an Auth0 token, including the silent refresh + popup fallback strategy.

- Simplifies the process of ensuring a user is authenticated with Firebase for components that require it.

## 4. Testing Strategy

A comprehensive testing strategy ensures the reliability and correctness of the authentication mechanism.

### 4.1. Unit Tests (`src/services/__tests__/authBridge.test.ts`)

- **Scope**: Focus on testing the `AuthBridge` class in isolation and the `useFirebaseAuth` hook's interaction with a mocked `AuthBridge`.

- **Key Scenarios Tested for `AuthBridge`**:
    - **Token Validation**: Correct validation of valid, expired, and malformed Auth0 tokens. Warnings for soon-to-expire tokens.
    - **Token Caching**: Successful caching of tokens, retrieval from cache, and automatic pruning of expired cached tokens. Manual cache clearing.
    - **Retry Logic**: Verification of retry attempts with exponential backoff for failed token exchanges and Firebase sign-ins. Failure after max retries.
    - **Health Check**: Correct reporting of healthy, degraded, and unhealthy states based on mocked component availability.
    - **Debug Information**: Accurate tracking and retrieval of debug logs and cache information.

- **Key Scenarios Tested for `useFirebaseAuth`**:
    - Successful authentication flow.
    - Fallback from silent token refresh to popup.
    - Forced token refresh (`refreshToken`).
    - Handling of unauthenticated users.
    - Availability of debug utilities.

- **Mocks**: Uses Jest mocks for Firebase services (`auth`, `functions`), Auth0 SDK (`useAuth0`), and simulates `httpsCallable` behavior.

### 4.2. Integration Tests (`src/services/__tests__/authBridge.integration.test.ts`)

- **Scope**: Test the interaction between `AuthBridge`, `useFirebaseAuth`, and mocked versions of external services (Auth0, Firebase Functions via `fetch`) to simulate real-world scenarios more closely.

- **Key Scenarios Tested**:
    - **Full Authentication Flow**: Successful end-to-end authentication from Auth0 token retrieval to Firebase sign-in, including simulated Firebase Function call.
    - **Token Expiry & Refresh**: Correct handling of an expired Auth0 token, triggering a refresh, and successful subsequent authentication.
    - **Network Failure & Retries**: Simulation of transient network errors during Firebase Function calls, verifying retry logic and eventual success.
    - **Caching Efficiency**: Ensuring that subsequent authentication attempts utilize cached tokens and avoid redundant API calls.
    - **Error Handling Across Components**:
        - Failures in Firebase Function token exchange (e.g., invalid Auth0 token sent to function).
        - Failures in Firebase `signInWithCustomToken`.
    - **Auth0 Popup Fallback**: Correct invocation of `getAccessTokenWithPopup` when `getAccessTokenSilently` fails.
    - **Performance and Monitoring Utilities**: Basic verification of debug info and health check accessibility in an integrated context.

- **Mocks**:
    - `useAuth0` is mocked to simulate different Auth0 states and token retrieval outcomes.
    - `fetch` is mocked globally to simulate Firebase Function calls, allowing assertions on request/response and simulation of network conditions.
    - Firebase `auth` object is mocked to control `currentUser` and spy on `signInWithCustomToken`.

## 5. How to Use & Debug

### 5.1. Ensuring Firebase Authentication

In components or services requiring Firebase authentication:

```typescript
import { useFirebaseAuth } from './services/authBridge'; // Adjust path as needed

function MySecureComponent() {
  const { ensureFirebaseAuth, refreshToken } = useFirebaseAuth();

  useEffect(() => {
    const authenticate = async () => {
      const isAuthenticated = await ensureFirebaseAuth();
      if (isAuthenticated) {
        // Proceed with Firebase dependent logic
      } else {
        // Handle failed authentication
      }
    };
    authenticate();
  }, [ensureFirebaseAuth]);

  // To force a token refresh (e.g., on a specific user action or error)
  const handleForceRefresh = async () => {
    await refreshToken();
  };
  // ...
}

```

### 5.2. Accessing Debug Information

For troubleshooting in development:

```typescript
import { useFirebaseAuth } from './services/authBridge';

function AuthDebugTools() {
  const { getDebugInfo, clearCache, healthCheck } = useFirebaseAuth();

  const showDebug = () => {
    console.log('Auth Debug Info:', getDebugInfo());
  };

  const runHealthCheck = async () => {
    console.log('Auth Health Check:', await healthCheck());
  };

  return (
    <div>
      <button onClick={showDebug}>Show Auth Debug</button>
      <button onClick={clearCache}>Clear Token Cache</button>
      <button onClick={runHealthCheck}>Run Auth Health Check</button>
    </div>
  );
}

```

### 5.3. Interpreting Debug Logs

- Logs from `AuthBridge` are prefixed with `[AuthBridge YYYY-MM-DDTHH:mm:ss.sssZ]`.

- Key log messages to look for:
    - `🔐 Firebase Functions initialized for Auth Bridge`
    - `🎯 Using cached Firebase token`
    - `🔐 Exchanging Auth0 token for Firebase token (HIPAA compliant)`
    - `✅ Secure token exchange successful`
    - `❌ HIPAA-compliant token exchange failed` (followed by error details)
    - `⏳ Token exchange retry X/Y in Zms`
    - `⏱️ Token exchange completed in Xms`
    - `⚠️ Auth0 token expires soon, should refresh`

## 6. Configuration

This enhanced authentication system relies on the existing Auth0 and Firebase configurations:

- **Auth0**: Domain, Client ID, Audience, Redirect URI (typically configured via environment variables like `VITE_AUTH0_DOMAIN`, etc., and loaded in `src/auth/auth0-config.ts`).

- **Firebase**: Configuration for Firebase app initialization (API key, auth domain, etc., in `src/config/firebase.ts`) and the name of the Firebase Cloud Function for token exchange (hardcoded as `exchangeAuth0Token` in `AuthBridge.ts`).

No new explicit configuration files were added for this specific enhancement, but the correct setup of these existing configurations is crucial.

## 7. Future Considerations/Improvements

- **Server-Side Token Validation (Firebase Function)**: While the client validates the Auth0 token's expiry, robust server-side validation within the `exchangeAuth0Token` Firebase Function (using JWKS) is critical and assumed to be in place.

- **More Granular Error Codes/Types**: The system could be enhanced to provide more specific error codes or types for different failure modes, aiding in more targeted error handling in the UI.

- **Centralized Error Reporting**: Integrate with a centralized error reporting service (e.g., Sentry) for better monitoring of authentication failures in production.

- **Background Token Refresh**: For applications with long-lived sessions, explore a proactive background refresh mechanism slightly before the Auth0 token (or the cached Firebase token) expires, to ensure a seamless user experience.

- **Dynamic Firebase Function Name**: If needed, the Firebase Function name for token exchange could be made configurable.
