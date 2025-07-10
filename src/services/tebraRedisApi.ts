/**
 * Tebra Redis API Service
 * Uses Redis streams for async communication instead of direct HTTP calls
 * Bypasses CORS issues completely
 */

import { v4 as uuidv4 } from 'uuid';
import { useAuth0 } from '@auth0/auth0-react';

// Types
interface TebraRequest {
  id: string;
  action: string;
  params: Record<string, any>;
  userId: string;
  timestamp: string;
  correlationId: string;
}

interface TebraResponse {
  id: string;
  requestId: string;
  correlationId: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  data?: any;
  error?: string;
  timestamp: string;
  duration?: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp?: string;
}

// SSE event listener management
type SSEListener = (event: MessageEvent) => void;
const sseListeners = new Map<string, SSEListener>();

class TebraRedisApi {
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private getAccessToken: (() => Promise<string>) | null = null;
  private getUserId: (() => string | undefined) | null = null;

  constructor() {
    this.initializeSSE();
  }

  /**
   * Initialize with Auth0 token provider
   */
  public initialize(getAccessToken: () => Promise<string>, getUserId: () => string | undefined) {
    this.getAccessToken = getAccessToken;
    this.getUserId = getUserId;
  }

  /**
   * Initialize Server-Sent Events connection
   */
  private initializeSSE() {
    const sseUrl = import.meta.env.VITE_REDIS_SSE_URL || 'http://localhost:3001/events';
    
    if (!sseUrl) {
      console.warn('No SSE URL configured for Redis events');
      return;
    }

    this.eventSource = new EventSource(sseUrl);

    this.eventSource.onopen = () => {
      console.log('✅ Connected to Redis SSE stream');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleSSEMessage(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    this.eventSource.onerror = () => {
      console.error('❌ SSE connection error');
      this.handleReconnect();
    };
  }

  /**
   * Handle SSE reconnection with exponential backoff
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.initializeSSE();
    }, delay);
  }

  /**
   * Handle incoming SSE messages
   */
  private handleSSEMessage(message: any) {
    // Check if this is a Tebra response
    if (message.type === 'tebra_response' && message.data) {
      const response = JSON.parse(message.data) as TebraResponse;
      this.handleResponse(response);
    }
  }

  /**
   * Handle Tebra response
   */
  private handleResponse(response: TebraResponse) {
    const pending = this.pendingRequests.get(response.correlationId);
    
    if (!pending) {
      return; // Not our request
    }

    // Clear timeout
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.correlationId);

    // Resolve or reject based on status
    if (response.status === 'success') {
      pending.resolve({
        success: true,
        data: response.data,
        timestamp: response.timestamp
      });
    } else if (response.status === 'error') {
      pending.reject(new Error(response.error || 'Request failed'));
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string> {
    if (!this.getUserId) {
      throw new Error('Auth not initialized');
    }
    
    const userId = this.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return userId;
  }

  /**
   * Publish request to Redis
   */
  private async publishRequest(action: string, params: any, correlationId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    
    const request: TebraRequest = {
      id: uuidv4(),
      action,
      params,
      userId,
      timestamp: new Date().toISOString(),
      correlationId
    };

    // Send to Redis via fetch API
    const redisApiUrl = import.meta.env.VITE_REDIS_API_URL || 'http://localhost:3000/api/redis/publish';
    
    if (!this.getAccessToken) {
      throw new Error('Auth not initialized');
    }
    
    const token = await this.getAccessToken();
    
    const response = await fetch(redisApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        stream: 'tebra:requests',
        message: request
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to publish request: ${response.statusText}`);
    }
  }

  /**
   * Wait for response with timeout
   */
  private waitForResponse(correlationId: string, timeoutMs: number = 30000): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('Request timeout'));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, { resolve, reject, timeout });
    });
  }

  /**
   * Generic method to call Tebra API via Redis
   */
  private async callTebra(action: string, params: Record<string, any> = {}): Promise<ApiResponse> {
    const correlationId = uuidv4();

    try {
      // Publish request
      await this.publishRequest(action, params, correlationId);

      // Wait for response
      return await this.waitForResponse(correlationId);
    } catch (error) {
      console.error(`Tebra API error for ${action}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to execute ${action}`
      };
    }
  }

  // Public API methods

  async testConnection(): Promise<ApiResponse> {
    return this.callTebra('testConnection');
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.callTebra('healthCheck');
  }

  async getPatient(patientId: string): Promise<ApiResponse> {
    return this.callTebra('getPatient', { patientId });
  }

  async searchPatients(lastName: string, firstName?: string): Promise<ApiResponse> {
    return this.callTebra('searchPatients', { lastName, firstName });
  }

  async getPatients(filters?: any): Promise<ApiResponse> {
    return this.callTebra('getPatients', { filters });
  }

  async getProviders(): Promise<ApiResponse> {
    return this.callTebra('getProviders');
  }

  async getAppointments(params: {
    fromDate?: string;
    toDate?: string;
    providerId?: string;
    patientId?: string;
  }): Promise<ApiResponse> {
    return this.callTebra('getAppointments', params);
  }

  async createAppointment(appointmentData: Record<string, unknown>): Promise<ApiResponse> {
    return this.callTebra('createAppointment', appointmentData);
  }

  async updateAppointment(appointmentData: Record<string, unknown>): Promise<ApiResponse> {
    return this.callTebra('updateAppointment', appointmentData);
  }

  async syncSchedule(params: { date: string }): Promise<ApiResponse> {
    return this.callTebra('syncSchedule', params);
  }

  async getRoomStatus(): Promise<ApiResponse> {
    return this.callTebra('getRoomStatus');
  }

  async updateRoomStatus(roomId: string, status: string): Promise<ApiResponse> {
    return this.callTebra('updateRoomStatus', { roomId, status });
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Clear all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Service disposed'));
    });
    this.pendingRequests.clear();

    // Close SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Export singleton instance
export const tebraRedisApi = new TebraRedisApi();

// Export types
export type { ApiResponse, TebraRequest, TebraResponse }; 