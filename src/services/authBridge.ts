import { useAuth0 } from '@auth0/auth0-react';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { auth, functions } from '../config/firebase';
import { httpsCallable, HttpsCallable } from 'firebase/functions';

interface TokenExchangeRequest {
  auth0Token: string;
}

interface TokenExchangeResponse {
  success: boolean;
  firebaseToken?: string;
  uid?: string;
  message?: string;
}

interface TokenCacheEntry {
  firebaseToken: string;
  auth0Token: string;
  expiresAt: number;
  uid: string;
}

interface AuthDebugInfo {
  timestamp: number;
  auth0TokenPresent: boolean;
  auth0TokenExpiry?: number;
  firebaseUserPresent: boolean;
  firebaseUid?: string;
  cacheHit: boolean;
  retryCount: number;
  errorDetails?: string;
  performanceMs: number;
}

/**
 * HIPAA-Compliant Authentication Bridge with Enhanced Debugging
 * Securely exchanges Auth0 tokens for Firebase custom tokens with comprehensive logging
 */
export class AuthBridge {
  private static instance: AuthBridge;
  private exchangeTokenFunction: HttpsCallable<TokenExchangeRequest, TokenExchangeResponse> | null = null;
  private tokenCache = new Map<string, TokenCacheEntry>();
  private debugLog: AuthDebugInfo[] = [];
  private maxDebugEntries = 100;
  private retryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };
  
  private constructor() {
    // Initialize the token exchange function
    if (functions) {
      this.exchangeTokenFunction = httpsCallable(functions, 'exchangeAuth0Token');
      this.logDebug('🔐 Firebase Functions initialized for Auth Bridge');
    } else {
      this.logDebug('⚠️ Firebase Functions not available - Auth Bridge disabled');
    }

    // Set up Firebase auth state monitoring for debugging
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        this.logDebug(user ? `🔐 Firebase user authenticated: ${user.uid}` : '🔐 Firebase user signed out');
      });
    }
  }
  
  static getInstance(): AuthBridge {
    if (!AuthBridge.instance) {
      AuthBridge.instance = new AuthBridge();
    }
    return AuthBridge.instance;
  }

  /**
   * Enhanced logging with structured debug information
   */
  public logDebug(message: string, data?: unknown): void {
    const timestamp = Date.now();
    console.log(`[AuthBridge ${new Date(timestamp).toISOString()}] ${message}`, data || '');
    
    // Store for debugging analysis
    if (this.debugLog.length >= this.maxDebugEntries) {
      this.debugLog.shift(); // Remove oldest entry
    }
  }

  /**
   * Validate Auth0 token format and expiry
   */
  private validateAuth0Token(token: string): { valid: boolean; expiry?: number; error?: string } {
    try {
      const [header, payload] = token.split('.');
      if (!header || !payload) {
        return { valid: false, error: 'Invalid token format' };
      }

      const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      const expiry = decodedPayload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      if (expiry <= now) {
        return { valid: false, error: 'Token expired', expiry };
      }

      // Check if token expires within next 5 minutes (early refresh)
      const fiveMinutes = 5 * 60 * 1000;
      if (expiry <= now + fiveMinutes) {
        this.logDebug('⚠️ Auth0 token expires soon, should refresh', { expiresIn: expiry - now });
      }

      return { valid: true, expiry };
    } catch (error) {
      return { valid: false, error: `Token validation failed: ${error}` };
    }
  }

  /**
   * Get cached token if valid
   */
  private getCachedToken(auth0TokenHash: string): TokenCacheEntry | null {
    const cached = this.tokenCache.get(auth0TokenHash);
    if (!cached) return null;

    // Check if cache entry is still valid (buffer of 5 minutes)
    const buffer = 5 * 60 * 1000;
    if (Date.now() >= cached.expiresAt - buffer) {
      this.tokenCache.delete(auth0TokenHash);
      this.logDebug('🗑️ Removed expired token from cache');
      return null;
    }

    return cached;
  }

  /**
   * Cache Firebase token with expiry
   */
  private cacheToken(auth0TokenHash: string, firebaseToken: string, auth0Token: string, uid: string): void {
    // Firebase custom tokens expire after 1 hour
    const expiresAt = Date.now() + (55 * 60 * 1000); // 55 minutes to be safe
    
    this.tokenCache.set(auth0TokenHash, {
      firebaseToken,
      auth0Token,
      expiresAt,
      uid
    });

    this.logDebug('💾 Cached Firebase token', { uid, expiresAt: new Date(expiresAt) });
  }

  /**
   * Retry logic with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= this.retryConfig.maxRetries) {
        this.logDebug(`❌ ${context} failed after ${retryCount} retries`, error);
        throw error;
      }

      const delay = Math.min(
        this.retryConfig.baseDelay * Math.pow(2, retryCount),
        this.retryConfig.maxDelay
      );

      this.logDebug(`⏳ ${context} retry ${retryCount + 1}/${this.retryConfig.maxRetries} in ${delay}ms`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(operation, context, retryCount + 1);
    }
  }

  /**
   * HIPAA-Compliant token exchange with enhanced debugging and caching
   */
  async exchangeTokens(auth0Token: string): Promise<string> {
    const startTime = Date.now();
    const debugInfo: Partial<AuthDebugInfo> = {
      timestamp: startTime,
      auth0TokenPresent: !!auth0Token,
      cacheHit: false,
      retryCount: 0
    };

    try {
      if (!this.exchangeTokenFunction) {
        throw new Error('Firebase Functions not available');
      }

      // Validate Auth0 token
      const validation = this.validateAuth0Token(auth0Token);
      debugInfo.auth0TokenExpiry = validation.expiry;
      
      if (!validation.valid) {
        throw new Error(`Invalid Auth0 token: ${validation.error}`);
      }

      // Check cache first
      const tokenHash = btoa(auth0Token.substring(0, 50)); // Hash for cache key
      const cached = this.getCachedToken(tokenHash);
      
      if (cached) {
        debugInfo.cacheHit = true;
        debugInfo.firebaseUserPresent = true;
        debugInfo.firebaseUid = cached.uid;
        this.logDebug('🎯 Using cached Firebase token', { uid: cached.uid });
        return cached.firebaseToken;
      }

      this.logDebug('🔐 Exchanging Auth0 token for Firebase token (HIPAA compliant)');
      
      // Exchange token with retry logic
      const result = await this.withRetry(async () => {
        return await this.exchangeTokenFunction!({ auth0Token });
      }, 'Token exchange');

      const response = result.data;

      if (!response.success || !response.firebaseToken) {
        throw new Error(response.message || 'Token exchange failed');
      }

      // Cache the successful result
      if (response.uid) {
        this.cacheToken(tokenHash, response.firebaseToken, auth0Token, response.uid);
        debugInfo.firebaseUid = response.uid;
      }

      debugInfo.firebaseUserPresent = true;
      this.logDebug('✅ Secure token exchange successful', { uid: response.uid });
      return response.firebaseToken;

    } catch (error) {
      debugInfo.errorDetails = error instanceof Error ? error.message : String(error);
      this.logDebug('❌ HIPAA-compliant token exchange failed', error);
      throw new Error('Authentication failed - required for patient data access');
    } finally {
      debugInfo.performanceMs = Date.now() - startTime;
      this.debugLog.push(debugInfo as AuthDebugInfo);
      this.logDebug(`⏱️ Token exchange completed in ${debugInfo.performanceMs}ms`);
    }
  }

  /**
   * HIPAA-Compliant Firebase authentication with retry and debugging
   */
  async signInWithAuth0Token(auth0Token: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not available');
    }

    try {
      this.logDebug('🔐 Starting HIPAA-compliant authentication process');
      
      const firebaseToken = await this.exchangeTokens(auth0Token);
      
      await this.withRetry(async () => {
        await signInWithCustomToken(auth, firebaseToken);
      }, 'Firebase sign-in');
      
      this.logDebug('✅ HIPAA-compliant Firebase authentication successful');
    } catch (error) {
      this.logDebug('❌ HIPAA-compliant authentication failed', error);
      throw new Error('Authentication required for patient data access (HIPAA compliance)');
    }
  }

  /**
   * Clear all cached tokens (useful for logout or debugging)
   */
  clearTokenCache(): void {
    const cacheSize = this.tokenCache.size;
    this.tokenCache.clear();
    this.logDebug(`🗑️ Cleared ${cacheSize} cached tokens`);
  }

  /**
   * Get debug information for troubleshooting
   */
  getDebugInfo(): {
    recentLog: AuthDebugInfo[];
    cacheSize: number;
    cacheEntries: Array<{ uid: string; expiresAt: string; expiresIn: number }>;
  } {
    const cacheEntries = Array.from(this.tokenCache.entries()).map(([hash, entry]) => ({
      uid: entry.uid,
      expiresAt: new Date(entry.expiresAt).toISOString(),
      expiresIn: entry.expiresAt - Date.now()
    }));

    return {
      recentLog: this.debugLog.slice(-20), // Last 20 entries
      cacheSize: this.tokenCache.size,
      cacheEntries
    };
  }

  /**
   * Health check for the authentication system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    details: Record<string, any>;
  }> {
    const checks = {
      firebaseAuth: !!auth,
      firebaseAuthCurrentUser: !!auth?.currentUser,
      firebaseFunctions: !!functions,
      exchangeFunction: !!this.exchangeTokenFunction,
    };

    const failedChecks = Object.values(checks).filter(check => !check).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks === 0) status = 'healthy';
    else if (failedChecks <= 2) status = 'degraded';
    else status = 'unhealthy';

    return {
      status,
      checks,
      details: {
        cacheSize: this.tokenCache.size,
        recentErrors: this.debugLog.slice(-5).filter(log => log.errorDetails),
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Enhanced Hook with token refresh capabilities and debugging
 */
export const useFirebaseAuth = () => {
  const { getAccessTokenSilently, isAuthenticated, getAccessTokenWithPopup } = useAuth0();
  const authBridge = AuthBridge.getInstance();

  const ensureFirebaseAuth = async (forceRefresh = false): Promise<boolean> => {
    if (!isAuthenticated) {
      authBridge.logDebug('❌ User not authenticated with Auth0');
      return false;
    }

    try {
      authBridge.logDebug('🔐 Ensuring HIPAA-compliant authentication for patient data access');
      
      let auth0Token: string;
      
      try {
        // Try silent token refresh first
        auth0Token = await getAccessTokenSilently({
          cacheMode: forceRefresh ? 'off' : 'on',
          detailedResponse: false
        });
      } catch (silentError) {
        authBridge.logDebug('⚠️ Silent token refresh failed, trying popup', silentError);
        
        // Fallback to popup if silent refresh fails
        try {
          const result = await getAccessTokenWithPopup();
          auth0Token = result as string;
        } catch (popupError) {
          authBridge.logDebug('❌ Both silent and popup token refresh failed', popupError);
          throw new Error('Unable to refresh authentication token');
        }
      }

      await authBridge.signInWithAuth0Token(auth0Token);
      
      authBridge.logDebug('✅ HIPAA-compliant authentication verified');
      return true;
    } catch (error) {
      authBridge.logDebug('❌ HIPAA-compliant authentication setup failed', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    return ensureFirebaseAuth(true);
  };

  const getDebugInfo = () => authBridge.getDebugInfo();
  const clearCache = () => authBridge.clearTokenCache();
  const healthCheck = () => authBridge.healthCheck();

  return { 
    ensureFirebaseAuth, 
    refreshToken, 
    getDebugInfo, 
    clearCache, 
    healthCheck 
  };
}; 