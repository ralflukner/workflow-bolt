import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuthBridge, useFirebaseAuth } from '../authBridge';
import { renderHook, act } from '@testing-library/react';
import { useAuth0, User as Auth0User } from '@auth0/auth0-react';
import { httpsCallable as firebaseHttpsCallable, FirebaseFunctions } from 'firebase/functions';
import { Auth as FirebaseAuth } from 'firebase/auth';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signInWithCustomToken: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(),
  getFunctions: jest.fn(() => ({}))
}));

jest.mock('../config/firebase', () => ({
  auth: { currentUser: null } as FirebaseAuth,
  functions: {} as FirebaseFunctions,
}));

// Mock Auth0
jest.mock('@auth0/auth0-react');

const mockUseAuth0 = useAuth0 as jest.MockedFunction<typeof useAuth0>;

describe('AuthBridge', () => {
  let authBridge: AuthBridge;
  let mockExchangeFunction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton
    (AuthBridge as { instance: AuthBridge | null }).instance = null;
    
    // Mock Firebase Functions
    mockExchangeFunction = jest.fn();
    (firebaseHttpsCallable as jest.Mock).mockReturnValue(mockExchangeFunction);
    
    authBridge = AuthBridge.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Validation', () => {
    it('should validate Auth0 token format and expiry', async () => {
      // Create a mock JWT token with expiry in the future
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;

      mockExchangeFunction.mockResolvedValue({
        data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
      });

      const result = await authBridge.exchangeTokens(validToken);
      expect(result).toBe('firebase-token');
      expect(mockExchangeFunction).toHaveBeenCalledWith({ auth0Token: validToken });
    });

    it('should reject expired Auth0 tokens', async () => {
      // Create a mock JWT token with expiry in the past
      const pastExpiry = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
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
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Token expires in 3 minutes (less than 5 minute warning threshold)
      const soonExpiry = Math.floor(Date.now() / 1000) + 180;
      const payload = btoa(JSON.stringify({ exp: soonExpiry }));
      const soonToExpireToken = `header.${payload}.signature`;

      mockExchangeFunction.mockResolvedValue({
        data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
      });

      await authBridge.exchangeTokens(soonToExpireToken);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth0 token expires soon'),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Token Caching', () => {
    it('should cache successful token exchanges', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;

      mockExchangeFunction.mockResolvedValue({
        data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
      });

      // First call should hit the exchange function
      await authBridge.exchangeTokens(validToken);
      expect(mockExchangeFunction).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await authBridge.exchangeTokens(validToken);
      expect(result).toBe('firebase-token');
      expect(mockExchangeFunction).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should clear expired tokens from cache', async () => {
      const futureExpiry = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureExpiry }));
      const validToken = `header.${payload}.signature`;

      mockExchangeFunction.mockResolvedValue({
        data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
      });

      // Mock Date.now to simulate cache expiry
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 60 * 60 * 1000); // 1 hour later

      try {
        await authBridge.exchangeTokens(validToken);
        expect(mockExchangeFunction).toHaveBeenCalledTimes(1);

        // Cache should be expired, so should call exchange function again
        await authBridge.exchangeTokens(validToken);
        expect(mockExchangeFunction).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = originalNow;
      }
    });

    it('should clear all cached tokens', () => {
      const debugInfo = authBridge.getDebugInfo();
      const initialCacheSize = debugInfo.cacheSize;

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

      // First two calls fail, third succeeds
      mockExchangeFunction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
        });

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
      expect(mockExchangeFunction).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when all components are available', async () => {
      const { auth: mockAuth } = await import('../config/firebase');
      (mockAuth as { currentUser: Auth0User | null }).currentUser = { sub: 'test-user' } as Auth0User;

      const health = await authBridge.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.checks.firebaseAuth).toBe(true);
      expect(health.checks.firebaseFunctions).toBe(true);
      expect(health.checks.exchangeFunction).toBe(true);
    });

    it('should return degraded status with partial failures', async () => {
      const { auth: mockAuth } = await import('../config/firebase');
      (mockAuth as { currentUser: Auth0User | null }).currentUser = null;

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

      mockExchangeFunction.mockResolvedValue({
        data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
      });

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
  beforeEach(() => {
    jest.clearAllMocks();
    (AuthBridge as { instance: AuthBridge | null }).instance = null;
  });

  it('should handle successful authentication', async () => {
    const mockGetAccessTokenSilently = jest.fn().mockResolvedValue('valid-auth0-token');
    const mockGetAccessTokenWithPopup = jest.fn();

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      getAccessTokenSilently: mockGetAccessTokenSilently,
      getAccessTokenWithPopup: mockGetAccessTokenWithPopup,
      user: { sub: 'test-user' },
    } as ReturnType<typeof useAuth0>);

    // Mock successful Firebase Functions
    const mockExchangeFunction = jest.fn().mockResolvedValue({
      data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
    });
    (firebaseHttpsCallable as jest.Mock).mockReturnValue(mockExchangeFunction);

    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      const success = await result.current.ensureFirebaseAuth();
      expect(success).toBe(true);
    });

    expect(mockGetAccessTokenSilently).toHaveBeenCalled();
    expect(mockExchangeFunction).toHaveBeenCalledWith({ auth0Token: 'valid-auth0-token' });
  });

  it('should handle silent token refresh failure and fallback to popup', async () => {
    const mockGetAccessTokenSilently = jest.fn().mockRejectedValue(new Error('Silent refresh failed'));
    const mockGetAccessTokenWithPopup = jest.fn().mockResolvedValue('popup-auth0-token');

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      getAccessTokenSilently: mockGetAccessTokenSilently,
      getAccessTokenWithPopup: mockGetAccessTokenWithPopup,
      user: { sub: 'test-user' },
    } as ReturnType<typeof useAuth0>);

    const mockExchangeFunction = jest.fn().mockResolvedValue({
      data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
    });
    (firebaseHttpsCallable as jest.Mock).mockReturnValue(mockExchangeFunction);

    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      const success = await result.current.ensureFirebaseAuth();
      expect(success).toBe(true);
    });

    expect(mockGetAccessTokenSilently).toHaveBeenCalled();
    expect(mockGetAccessTokenWithPopup).toHaveBeenCalled();
    expect(mockExchangeFunction).toHaveBeenCalledWith({ auth0Token: 'popup-auth0-token' });
  });

  it('should handle force refresh', async () => {
    const mockGetAccessTokenSilently = jest.fn().mockResolvedValue('refreshed-auth0-token');
    const mockGetAccessTokenWithPopup = jest.fn();

    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      getAccessTokenSilently: mockGetAccessTokenSilently,
      getAccessTokenWithPopup: mockGetAccessTokenWithPopup,
      user: { sub: 'test-user' },
    } as ReturnType<typeof useAuth0>);

    const mockExchangeFunction = jest.fn().mockResolvedValue({
      data: { success: true, firebaseToken: 'firebase-token', uid: 'user-123' }
    });
    (firebaseHttpsCallable as jest.Mock).mockReturnValue(mockExchangeFunction);

    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      const success = await result.current.refreshToken();
      expect(success).toBe(true);
    });

    expect(mockGetAccessTokenSilently).toHaveBeenCalledWith({
      cacheMode: 'off',
      detailedResponse: false
    });
  });

  it('should return false when user is not authenticated', async () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: false,
      getAccessTokenSilently: jest.fn(),
      getAccessTokenWithPopup: jest.fn(),
      user: undefined,
    } as ReturnType<typeof useAuth0>);

    const { result } = renderHook(() => useFirebaseAuth());

    await act(async () => {
      const success = await result.current.ensureFirebaseAuth();
      expect(success).toBe(false);
    });
  });

  it('should provide debug utilities', () => {
    mockUseAuth0.mockReturnValue({
      isAuthenticated: true,
      getAccessTokenSilently: jest.fn(),
      getAccessTokenWithPopup: jest.fn(),
      user: { sub: 'test-user' },
    } as ReturnType<typeof useAuth0>);

    const { result } = renderHook(() => useFirebaseAuth());

    expect(typeof result.current.getDebugInfo).toBe('function');
    expect(typeof result.current.clearCache).toBe('function');
    expect(typeof result.current.healthCheck).toBe('function');
  });
}); 