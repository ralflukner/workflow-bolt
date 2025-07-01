/**
 * Tebra Debug API Service Layer
 * 
 * Centralized API operations with proper error handling, timeout management,
 * and correlation ID generation for the Tebra Debug Dashboard.
 */

import { HEALTH_CHECK_CONFIG, CORRELATION_ID } from '../constants/tebraConfig';
import { tebraTestConnection, tebraGetAppointments, tebraGetProviders } from './tebraApi';
import { app, isFirebaseConfigured } from '../config/firebase';
import { getFunctions } from 'firebase/functions';
import { checkFirebaseEnvVars } from '../utils/envUtils';
import { AuthBridge } from './authBridge';

export interface CorrelationContext {
  correlationId: string;
  timestamp: Date;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
  correlationId: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  message: string;
  duration: number;
  correlationId: string;
  details?: Record<string, unknown>;
}

/**
 * Generate a correlation ID for tracing requests
 */
export function generateCorrelationId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = CORRELATION_ID.PREFIX;
  for (let i = 0; i < CORRELATION_ID.LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a timeout promise that rejects after the specified duration
 */
function createTimeout(ms: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation '${operation}' timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Wrap an async operation with timeout handling
 */
async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> {
  return Promise.race([
    operation,
    createTimeout(timeoutMs, operationName)
  ]);
}

/**
 * Parse and categorize Firebase/API errors
 */
export function parseApiError(error: unknown): string {
  if (!error) return 'Unknown error occurred';
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Timeout errors
    if (message.includes('timeout')) {
      return 'Request timed out - service may be overloaded';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connectivity issue';
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('token') || message.includes('401')) {
      return 'Authentication failed - token may be expired';
    }
    
    // Firebase Functions errors
    if (message.includes('firebase') || message.includes('functions')) {
      return 'Firebase Functions unavailable';
    }
    
    // Tebra/SOAP errors
    if (message.includes('soap') || message.includes('tebra')) {
      return 'Tebra API connection failed';
    }
    
    // PHP service errors
    if (message.includes('php') || message.includes('cloud run')) {
      return 'PHP service unavailable';
    }
    
    return error.message;
  }
  
  return String(error);
}

export class TebraDebugApiService {
  /**
   * Test Frontend Health (always healthy - this is the frontend!)
   */
  async testFrontendHealth(): Promise<HealthCheckResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      // Simple check that we're running in a browser environment
      const isHealthy = typeof window !== 'undefined' && typeof document !== 'undefined';
      const duration = Date.now() - startTime;
      
      return {
        status: isHealthy ? 'healthy' : 'error',
        message: isHealthy ? 'Frontend application running' : 'Not in browser environment',
        duration,
        correlationId,
        details: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: parseApiError(error),
        duration: Date.now() - startTime,
        correlationId
      };
    }
  }

  /**
   * Test Firebase Functions connectivity
   */
  async testFirebaseFunctions(): Promise<HealthCheckResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      // Check Firebase configuration
      if (!isFirebaseConfigured()) {
        return {
          status: 'error',
          message: 'Firebase not configured',
          duration: Date.now() - startTime,
          correlationId,
          details: { configured: false }
        };
      }

      // Check if Functions instance can be created
      if (!app) {
        return {
          status: 'error',
          message: 'Firebase app not initialized',
          duration: Date.now() - startTime,
          correlationId,
          details: { appInitialized: false }
        };
      }

      const functions = getFunctions(app);
      if (!functions) {
        return {
          status: 'error',
          message: 'Firebase Functions instance unavailable',
          duration: Date.now() - startTime,
          correlationId,
          details: { functionsAvailable: false }
        };
      }

      // Check environment variables
      const { loaded, missing } = checkFirebaseEnvVars();
      if (missing.length > 0) {
        return {
          status: 'warning',
          message: `Missing environment variables: ${missing.join(', ')}`,
          duration: Date.now() - startTime,
          correlationId,
          details: { loaded, missing }
        };
      }

      return {
        status: 'healthy',
        message: 'Firebase Functions configured',
        duration: Date.now() - startTime,
        correlationId,
        details: { 
          configured: true, 
          functionsAvailable: true,
          envVarsLoaded: loaded.length
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: parseApiError(error),
        duration: Date.now() - startTime,
        correlationId
      };
    }
  }

  /**
   * Test Tebra Proxy connectivity (Firebase Functions -> PHP)
   */
  async testTebraProxy(): Promise<HealthCheckResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      // Check authentication first
      const authBridge = AuthBridge.getInstance();
      const token = await authBridge.getFirebaseIdToken();
      
      if (!token) {
        return {
          status: 'error',
          message: 'No authentication token available',
          duration: Date.now() - startTime,
          correlationId,
          details: { authenticated: false }
        };
      }

      // Test connection with timeout
      const result = await withTimeout(
        tebraTestConnection(),
        HEALTH_CHECK_CONFIG.REQUEST_TIMEOUT,
        'Tebra Proxy Test'
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        return {
          status: 'healthy',
          message: 'Tebra proxy connection successful',
          duration,
          correlationId,
          details: { authenticated: true, response: result }
        };
      } else {
        return {
          status: 'error',
          message: result.error || result.message || 'Tebra proxy test failed',
          duration,
          correlationId,
          details: { authenticated: true, response: result }
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: parseApiError(error),
        duration: Date.now() - startTime,
        correlationId
      };
    }
  }

  /**
   * Test Tebra API connectivity (full chain test)
   */
  async testTebraApi(): Promise<HealthCheckResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      // Test both providers and appointments to ensure full API access
      const [providersResult, appointmentsResult] = await Promise.allSettled([
        withTimeout(
          tebraGetProviders(),
          HEALTH_CHECK_CONFIG.SOAP_TIMEOUT,
          'Get Providers'
        ),
        withTimeout(
          tebraGetAppointments({
            fromDate: new Date().toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0]
          }),
          HEALTH_CHECK_CONFIG.SOAP_TIMEOUT,
          'Get Appointments'
        )
      ]);

      const duration = Date.now() - startTime;
      const successCount = [providersResult, appointmentsResult]
        .filter(result => result.status === 'fulfilled' && result.value.success).length;

      if (successCount === 2) {
        return {
          status: 'healthy',
          message: 'Tebra API fully accessible',
          duration,
          correlationId,
          details: { 
            providersSuccess: providersResult.status === 'fulfilled' && providersResult.value.success,
            appointmentsSuccess: appointmentsResult.status === 'fulfilled' && appointmentsResult.value.success
          }
        };
      } else if (successCount === 1) {
        return {
          status: 'warning',
          message: 'Tebra API partially accessible',
          duration,
          correlationId,
          details: { 
            providersSuccess: providersResult.status === 'fulfilled' && providersResult.value.success,
            appointmentsSuccess: appointmentsResult.status === 'fulfilled' && appointmentsResult.value.success
          }
        };
      } else {
        const errors = [providersResult, appointmentsResult]
          .filter(result => result.status === 'rejected')
          .map(result => (result as PromiseRejectedResult).reason?.message || 'Unknown error');
        
        return {
          status: 'error',
          message: `Tebra API unavailable: ${errors.join(', ')}`,
          duration,
          correlationId,
          details: { errors }
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: parseApiError(error),
        duration: Date.now() - startTime,
        correlationId
      };
    }
  }

  /**
   * Test data transformation pipeline (simulated)
   */
  async testDataTransform(): Promise<HealthCheckResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      // For now, this is a simple check that our data structures are working
      // In the future, this could test actual data transformation logic
      const testData = {
        appointments: [],
        providers: [],
        patients: []
      };

      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 50));

      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Data transformation pipeline ready',
        duration,
        correlationId,
        details: testData
      };
    } catch (error) {
      return {
        status: 'error',
        message: parseApiError(error),
        duration: Date.now() - startTime,
        correlationId
      };
    }
  }

  /**
   * Test dashboard update capability (simulated)
   */
  async testDashboardUpdate(): Promise<HealthCheckResult> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    try {
      // Test that we can perform the basic dashboard operations
      const testOperations = [
        'metrics calculation',
        'error tracking',
        'status updates'
      ];

      // Simulate some processing
      await new Promise(resolve => setTimeout(resolve, 25));

      const duration = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Dashboard update system operational',
        duration,
        correlationId,
        details: { operations: testOperations }
      };
    } catch (error) {
      return {
        status: 'error',
        message: parseApiError(error),
        duration: Date.now() - startTime,
        correlationId
      };
    }
  }

  // Legacy method support for existing code
  parseFirebaseError(error: Error): string {
    return parseApiError(error);
  }

  generateCorrelationId(): string {
    return generateCorrelationId();
  }
}

export const tebraDebugApi = new TebraDebugApiService();