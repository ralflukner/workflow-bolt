/**
 * Tebra Debug API Service
 * Centralized API operations for Tebra integration monitoring
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { TEBRA_CONFIG } from '../constants/tebraDebug';

export class TebraDebugApiService {
  private functions = getFunctions();

  async testFirebaseFunctions(): Promise<boolean> {
    try {
      const response = await fetch(`${TEBRA_CONFIG.FIREBASE_FUNCTIONS_URL}/healthCheck`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.error('Firebase Functions health check failed:', error);
      return false;
    }
  }

  async testTebraConnection() {
    const testConnection = httpsCallable(this.functions, 'tebraTestConnection');
    return await Promise.race([
      testConnection(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), TEBRA_CONFIG.REQUEST_TIMEOUT)
      )
    ]);
  }

  async getProviders() {
    const getProviders = httpsCallable(this.functions, 'tebraGetProviders');
    return await Promise.race([
      getProviders(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10s')), TEBRA_CONFIG.REQUEST_TIMEOUT)
      )
    ]);
  }

  async testAppointments(date: string) {
    const testAppointments = httpsCallable(this.functions, 'tebraTestAppointments');
    return await Promise.race([
      testAppointments({ date }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 15s')), TEBRA_CONFIG.SOAP_TIMEOUT)
      )
    ]);
  }

  parseFirebaseError(error: Error): string {
    if (error.message.includes('internal')) {
      return 'Internal Firebase Functions error - check function logs';
    } else if (error.message.includes('unauthenticated')) {
      return 'Authentication required';
    } else if (error.message.includes('permission-denied')) {
      return 'Permission denied - check IAM roles';
    } else if (error.message.includes('timeout')) {
      return 'Request timeout';
    } else if (error.message.includes('Unauthorized')) {
      return 'OAuth authentication failed - check credentials';
    } else if (error.message.includes('network')) {
      return 'Network connectivity issue';
    }
    return error.message;
  }

  generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}

export const tebraDebugApi = new TebraDebugApiService();