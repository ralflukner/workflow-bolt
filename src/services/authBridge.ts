import { useAuth0 } from '@auth0/auth0-react';
import { signInWithCustomToken } from 'firebase/auth';
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

/**
 * HIPAA-Compliant Authentication Bridge
 * Securely exchanges Auth0 tokens for Firebase custom tokens
 */
export class AuthBridge {
  private static instance: AuthBridge;
  private exchangeTokenFunction: HttpsCallable<TokenExchangeRequest, TokenExchangeResponse> | null = null;
  
  private constructor() {
    // Initialize the token exchange function
    if (functions) {
      this.exchangeTokenFunction = httpsCallable(functions, 'exchangeAuth0Token');
      console.log('🔐 Firebase Functions initialized for Auth Bridge');
    } else {
      console.warn('⚠️ Firebase Functions not available - Auth Bridge disabled');
    }
  }
  
  static getInstance(): AuthBridge {
    if (!AuthBridge.instance) {
      AuthBridge.instance = new AuthBridge();
    }
    return AuthBridge.instance;
  }

  /**
   * HIPAA-Compliant token exchange
   * Validates Auth0 token and returns Firebase custom token
   */
  async exchangeTokens(auth0Token: string): Promise<string> {
    if (!this.exchangeTokenFunction) {
      throw new Error('Firebase Functions not available');
    }

    try {
      console.log('🔐 Exchanging Auth0 token for Firebase token (HIPAA compliant)');
      
      const result = await this.exchangeTokenFunction({ auth0Token });
      const response = result.data;

      if (!response.success || !response.firebaseToken) {
        throw new Error(response.message || 'Token exchange failed');
      }

      console.log('✅ Secure token exchange successful');
      return response.firebaseToken;
    } catch (error) {
      console.error('HIPAA-compliant token exchange failed:', error);
      throw new Error('Authentication failed - required for patient data access');
    }
  }

  /**
   * HIPAA-Compliant Firebase authentication
   * Uses proper Auth0 to Firebase token exchange
   */
  async signInWithAuth0Token(auth0Token: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not available');
    }

    try {
      console.log('🔐 Starting HIPAA-compliant authentication process');
      
      const firebaseToken = await this.exchangeTokens(auth0Token);
      await signInWithCustomToken(auth, firebaseToken);
      
      console.log('✅ HIPAA-compliant Firebase authentication successful');
    } catch (error) {
      console.error('HIPAA-compliant authentication failed:', error);
      throw new Error('Authentication required for patient data access (HIPAA compliance)');
    }
  }
}

/**
 * Hook to ensure HIPAA-compliant Firebase authentication
 * Requires proper Auth0 authentication and token exchange
 */
export const useFirebaseAuth = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const authBridge = AuthBridge.getInstance();

  const ensureFirebaseAuth = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      console.error('User not authenticated with Auth0');
      return false;
    }

    try {
      console.log('🔐 Ensuring HIPAA-compliant authentication for patient data access');
      
      const auth0Token = await getAccessTokenSilently();
      await authBridge.signInWithAuth0Token(auth0Token);
      
      console.log('✅ HIPAA-compliant authentication verified');
      return true;
    } catch (error) {
      console.error('HIPAA-compliant authentication setup failed:', error);
      return false;
    }
  };

  return { ensureFirebaseAuth };
}; 