/**
 * Tebra Debug Dashboard Constants and Types
 * Production-ready configuration and type definitions
 */

export const TEBRA_CONFIG = {
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds in production
  REQUEST_TIMEOUT: 10000,
  SOAP_TIMEOUT: 15000,
  MAX_RECENT_ERRORS: 10,
  FIREBASE_FUNCTIONS_URL: import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-luknerlumina-firebase.cloudfunctions.net'
} as const;

export const STEP_IDS = {
  FRONTEND: 'frontend',
  FIREBASE_FUNCTIONS: 'firebase-functions', 
  TEBRA_PROXY: 'tebra-proxy',
  CLOUD_RUN: 'cloud-run',
  TEBRA_API: 'tebra-api',
  DATA_TRANSFORM: 'data-transform',
  DASHBOARD_UPDATE: 'dashboard-update'
} as const;

export type StepId = typeof STEP_IDS[keyof typeof STEP_IDS];
export type StepStatus = 'healthy' | 'warning' | 'error' | 'unknown';

export interface DataFlowStep {
  id: StepId;
  name: string;
  status: StepStatus;
  lastCheck: Date;
  responseTime: number;
  errorMessage?: string;
  correlationId?: string;
}

export interface TebraMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastSuccessfulSync: Date | null;
  patientCount: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface RecentError {
  timestamp: Date;
  step: string;
  error: string;
  correlationId: string;
}

export interface PhpDiagnostics {
  nodeJsToPhp: DiagnosticResult;
  phpHealth: DiagnosticResult;
  phpToTebra: DiagnosticResult;
  recommendations?: string[];
}

interface DiagnosticResult {
  status: string;
  details: {
    error?: string | null;
    httpStatus?: number;
    responseTime?: number;
    canAuthenticate?: boolean;
    possibleCause?: string;
    providerCount?: number;
  };
}