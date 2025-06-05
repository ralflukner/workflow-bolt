import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuthBridge, useFirebaseAuth } from '../authBridge';
import { renderHook, act } from '@testing-library/react';
import { useAuth0, User as Auth0User, Auth0ContextInterface } from '@auth0/auth0-react';
import { httpsCallable as firebaseHttpsCallable } from 'firebase/functions';
import { Auth as FirebaseAuth, UserCredential, User as FirebaseUser } from 'firebase/auth';

// Define a more specific type for mockExchangeFunction
type ExchangeFunctionReturnType = Promise<{ data: { success: boolean; firebaseToken: string; uid: string; } }>;
type ExchangeFunctionArgsTuple = [{ auth0Token: string }];
type MockExchangeFunctionType = jest.Mock<(...args: ExchangeFunctionArgsTuple) => ExchangeFunctionReturnType>;

// Define types for Auth0 hook mocks
type GetAccessTokenSilentlyType = jest.Mock<() => Promise<string>>;
type GetAccessTokenWithPopupType = jest.Mock<() => Promise<string>>;

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signInWithCustomToken: jest.fn<() => Promise<UserCredential>>().mockResolvedValue({} as UserCredential),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
  getFunctions: jest.fn(() => ({})),
}));

// Create a mutable mock for Firebase Auth to control currentUser in tests
const mutableMockFirebaseAuth = {
  currentUser: null as FirebaseUser | null,
};

jest.mock('../config/firebase', () => ({
  auth: mutableMockFirebaseAuth as unknown as FirebaseAuth,
  functions: {} as unknown,
}));

// Mock Auth0
jest.mock('@auth0/auth0-react');

const mockUseAuth0 = useAuth0 as jest.MockedFunction<typeof useAuth0>;

// Helper to create a more complete Auth0 context mock
const createMockAuth0Context = (overrides: Partial<Auth0ContextInterface<Auth0User>> = {}): Auth0ContextInterface<Auth0User> => {
  return {
    isAuthenticated: false,
    user: undefined,
    isLoading: false,
    loginWithRedirect: jest.fn(),
    loginWithPopup: jest.fn(),
    logout: jest.fn(),
    getAccessTokenSilently: jest.fn() as GetAccessTokenSilentlyType,
    getAccessTokenWithPopup: jest.fn() as GetAccessTokenWithPopupType,
    getIdTokenClaims: jest.fn(),
    handleRedirectCallback: jest.fn(),
    ...overrides,
  } as Auth0ContextInterface<Auth0User>;
};

describe('AuthBridge', () => {
  let authBridge: AuthBridge;
  let mockExchangeFunction: MockExchangeFunctionType;

  beforeEach(() => {
    jest.clearAllMocks();
    (AuthBridge as unknown as { instance: AuthBridge | null }).instance = null;
    mockExchangeFunction = jest.fn() as MockExchangeFunctionType;
    (firebaseHttpsCallable as jest.Mock).mockReturnValue(mockExchangeFunction);
    authBridge = AuthBridge.getInstance();
    mutableMockFirebaseAuth.currentUser = null;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Validation', () => {
    it('should validate Auth0 token format and expiry', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;
      mockExchangeFunction.mockResolvedValue({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any);
      const result = await authBridge.exchangeTokens(validToken);
      expect(result).toBe('firebase-token');
      expect(mockExchangeFunction).toHaveBeenCalledWith({ auth0Token: validToken });
    });

    it('should reject expired Auth0 tokens', async () => {
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp: pastExpiry }));
      const expiredToken = `header.${payload}.signature`;
      await expect(authBridge.exchangeTokens(expiredToken)).rejects.toThrow('Invalid Auth0 token: Token expired');
      expect(mockExchangeFunction).not.toHaveBeenCalled();
    });

    it('should reject malformed Auth0 tokens', async () => {
      const malformedToken = 'invalid.token';
      await expect(authBridge.exchangeTokens(malformedToken)).rejects.toThrow('Invalid Auth0 token: Invalid token format');
      expect(mockExchangeFunction).not.toHaveBeenCalled();
    });

    it('should warn about tokens expiring soon', async () => {
      const consoleSpy = jest.spyOn(authBridge, 'logDebug').mockImplementation(() => {});
      const soonExpiry = Math.floor(Date.now() / 1000) + 180;
      const payload = btoa(JSON.stringify({ exp: soonExpiry }));
      const soonToExpireToken = `header.${payload}.signature`;
      mockExchangeFunction.mockResolvedValue({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any);
      await authBridge.exchangeTokens(soonToExpireToken);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Auth0 token expires soon'), expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('Token Caching', () => {
    it('should cache successful token exchanges', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;
      mockExchangeFunction.mockResolvedValue({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any);
      await authBridge.exchangeTokens(validToken);
      expect(mockExchangeFunction).toHaveBeenCalledTimes(1);
      const result = await authBridge.exchangeTokens(validToken);
      expect(result).toBe('firebase-token');
      expect(mockExchangeFunction).toHaveBeenCalledTimes(1);
    });

    it('should clear expired tokens from cache', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;
      mockExchangeFunction.mockResolvedValue({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any);
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 60 * 60 * 1000);
      try {
        await authBridge.exchangeTokens(validToken);
        expect(mockExchangeFunction).toHaveBeenCalledTimes(1);
        await authBridge.exchangeTokens(validToken);
        expect(mockExchangeFunction).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = originalNow;
      }
    });

    it('should clear all cached tokens', () => {
      authBridge.clearTokenCache();
      const afterClearInfo = authBridge.getDebugInfo();
      expect(afterClearInfo.cacheSize).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed token exchanges with exponential backoff', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;
      mockExchangeFunction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any);
      const result = await authBridge.exchangeTokens(validToken);
      expect(result).toBe('firebase-token');
      expect(mockExchangeFunction).toHaveBeenCalledTimes(3);
    });

    it('should fail after maximum retry attempts', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;
      mockExchangeFunction.mockRejectedValue(new Error('Persistent network error'));
      await expect(authBridge.exchangeTokens(validToken)).rejects.toThrow('Authentication failed');
      expect(mockExchangeFunction).toHaveBeenCalledTimes(4);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all components are available', async () => {
      mutableMockFirebaseAuth.currentUser = { uid: 'test-user' } as FirebaseUser;
      const health = await authBridge.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.checks.firebaseAuth).toBe(true);
      expect(health.checks.firebaseFunctions).toBe(true);
      expect(health.checks.exchangeFunction).toBe(true);
    });

    it('should return degraded status with partial failures', async () => {
      mutableMockFirebaseAuth.currentUser = null;
      const health = await authBridge.healthCheck();
      expect(health.status).toBe('degraded');
      expect(health.checks.firebaseAuthCurrentUser).toBe(false);
    });
  });

  describe('Debug Information', () => {
    it('should track debug information for token exchanges', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;
      mockExchangeFunction.mockResolvedValue({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any);
      await authBridge.exchangeTokens(validToken);
      const debugInfo = authBridge.getDebugInfo();
      expect(debugInfo.recentLog.length).toBeGreaterThan(0);
      const lastEntry = debugInfo.recentLog[debugInfo.recentLog.length - 1];
      expect(lastEntry.auth0TokenPresent).toBe(true);
      expect(lastEntry.firebaseUserPresent).toBe(true);
      expect(lastEntry.performanceMs).toBeGreaterThan(0);
    });
  });
});

describe('useFirebaseAuth Hook', () => {
  let mockGetAccessTokenSilently: GetAccessTokenSilentlyType;
  let mockGetAccessTokenWithPopup: GetAccessTokenWithPopupType;
  let mockExchangeFunctionHook: MockExchangeFunctionType;

  beforeEach(() => {
    jest.clearAllMocks();
    (AuthBridge as unknown as { instance: AuthBridge | null }).instance = null;
    mockGetAccessTokenSilently = jest.fn() as GetAccessTokenSilentlyType;
    mockGetAccessTokenWithPopup = jest.fn() as GetAccessTokenWithPopupType;
    mockExchangeFunctionHook = jest.fn().mockResolvedValue({ data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' } } as any) as MockExchangeFunctionType;
    (firebaseHttpsCallable as jest.Mock).mockReturnValue(mockExchangeFunctionHook);
    mutableMockFirebaseAuth.currentUser = null;
  });

  it('should handle successful authentication', async () => {
    mockGetAccessTokenSilently.mockResolvedValue('valid-auth0-token' as any);
    mockUseAuth0.mockReturnValue(createMockAuth0Context({
      isAuthenticated: true,
      user: { sub: 'test-user' } as Auth0User,
      getAccessTokenSilently: mockGetAccessTokenSilently,
    }));
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      const success = await result.current.ensureFirebaseAuth();
      expect(success).toBe(true);
    });
    expect(mockGetAccessTokenSilently).toHaveBeenCalled();
    expect(mockExchangeFunctionHook).toHaveBeenCalledWith({ auth0Token: 'valid-auth0-token' });
  });

  it('should handle silent token refresh failure and fallback to popup', async () => {
    mockGetAccessTokenSilently.mockRejectedValue(new Error('Silent refresh failed'));
    mockGetAccessTokenWithPopup.mockResolvedValue('popup-auth0-token' as any);
    mockUseAuth0.mockReturnValue(createMockAuth0Context({
      isAuthenticated: true,
      user: { sub: 'test-user' } as Auth0User,
      getAccessTokenSilently: mockGetAccessTokenSilently,
      getAccessTokenWithPopup: mockGetAccessTokenWithPopup,
    }));
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      const success = await result.current.ensureFirebaseAuth();
      expect(success).toBe(true);
    });
    expect(mockGetAccessTokenSilently).toHaveBeenCalled();
    expect(mockGetAccessTokenWithPopup).toHaveBeenCalled();
    expect(mockExchangeFunctionHook).toHaveBeenCalledWith({ auth0Token: 'popup-auth0-token' });
  });

  it('should handle force refresh', async () => {
    mockGetAccessTokenSilently.mockResolvedValue('refreshed-auth0-token' as any);
    mockUseAuth0.mockReturnValue(createMockAuth0Context({
      isAuthenticated: true,
      user: { sub: 'test-user' } as Auth0User,
      getAccessTokenSilently: mockGetAccessTokenSilently,
    }));
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      const success = await result.current.refreshToken();
      expect(success).toBe(true);
    });
    expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({ cacheMode: 'off', detailedResponse: false });
  });

  it('should return false when user is not authenticated', async () => {
    mockUseAuth0.mockReturnValue(createMockAuth0Context({ isAuthenticated: false }));
    const { result } = renderHook(() => useFirebaseAuth());
    await act(async () => {
      const success = await result.current.ensureFirebaseAuth();
      expect(success).toBe(false);
    });
  });

  it('should provide debug utilities', () => {
    mockUseAuth0.mockReturnValue(createMockAuth0Context({ isAuthenticated: true, user: { sub: 'test-user' } as Auth0User }));
    const { result } = renderHook(() => useFirebaseAuth());
    expect(typeof result.current.getDebugInfo).toBe('function');
    expect(typeof result.current.clearCache).toBe('function');
    expect(typeof result.current.healthCheck).toBe('function');
  });
}); 