/**
 * Redis Event Bus Testing and Debugging Utilities
 * 
 * Provides comprehensive tools for testing and debugging the Redis Event Bus
 * integration with the Tebra Debug Dashboard.
 */

import { AgentUpdate } from '../hooks/useRedisEventBus';
import { TebraRealtimeUpdate } from '../components/TebraDebugDashboardContainer';

// Test event templates for different scenarios
export const TEST_EVENTS = {
  // Healthy system events
  TEBRA_API_HEALTHY: {
    id: 'test-tebra-api-001',
    agent: 'tebra-api-monitor',
    msg: 'step:tebra_api status:healthy responseTime:150 All Tebra API endpoints responding normally',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-healthy-001'
  } as AgentUpdate,

  FIREBASE_FUNCTIONS_HEALTHY: {
    id: 'test-firebase-001',
    agent: 'firebase-functions-monitor',
    msg: 'step:firebase_functions status:healthy responseTime:200 Firebase Functions operational',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-firebase-001'
  } as AgentUpdate,

  PHP_PROXY_HEALTHY: {
    id: 'test-php-proxy-001',
    agent: 'php-proxy-monitor',
    msg: 'step:cloud_run status:healthy responseTime:300 PHP Cloud Run service operational',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-php-001'
  } as AgentUpdate,

  // Warning events
  TEBRA_API_WARNING: {
    id: 'test-tebra-api-002',
    agent: 'tebra-api-monitor',
    msg: 'step:tebra_api status:warning responseTime:3000 Tebra API responding slowly',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-warning-001'
  } as AgentUpdate,

  FIREBASE_AUTH_WARNING: {
    id: 'test-auth-001',
    agent: 'auth-monitor',
    msg: 'step:firebase_functions status:warning responseTime:1000 Auth token refresh required',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-auth-warning-001'
  } as AgentUpdate,

  // Error events
  TEBRA_API_ERROR: {
    id: 'test-tebra-api-003',
    agent: 'tebra-api-monitor',
    msg: 'step:tebra_api status:error responseTime:0 Tebra API connection failed - SOAP endpoint unreachable',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-error-001'
  } as AgentUpdate,

  PHP_PROXY_ERROR: {
    id: 'test-php-proxy-002',
    agent: 'php-proxy-monitor', 
    msg: 'step:cloud_run status:error responseTime:0 PHP Cloud Run service unavailable - 503 Service Unavailable',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-php-error-001'
  } as AgentUpdate,

  NETWORK_ERROR: {
    id: 'test-network-001',
    agent: 'network-monitor',
    msg: 'step:tebra_proxy status:error responseTime:0 Network connectivity issues detected',
    ts: new Date().toISOString(),
    type: 'tebra_health_check',
    correlationId: 'test-network-001'
  } as AgentUpdate
};

// Test scenarios for different integration states
export const TEST_SCENARIOS = {
  // All systems healthy
  ALL_HEALTHY: [
    TEST_EVENTS.FIREBASE_FUNCTIONS_HEALTHY,
    TEST_EVENTS.PHP_PROXY_HEALTHY,
    TEST_EVENTS.TEBRA_API_HEALTHY
  ],

  // Mixed health states
  PARTIAL_DEGRADATION: [
    TEST_EVENTS.FIREBASE_FUNCTIONS_HEALTHY,
    TEST_EVENTS.TEBRA_API_WARNING,
    TEST_EVENTS.PHP_PROXY_HEALTHY
  ],

  // System issues
  MAJOR_OUTAGE: [
    TEST_EVENTS.FIREBASE_AUTH_WARNING,
    TEST_EVENTS.PHP_PROXY_ERROR,
    TEST_EVENTS.TEBRA_API_ERROR,
    TEST_EVENTS.NETWORK_ERROR
  ],

  // Recovery sequence
  RECOVERY_SEQUENCE: [
    TEST_EVENTS.TEBRA_API_ERROR,
    TEST_EVENTS.TEBRA_API_WARNING,
    TEST_EVENTS.TEBRA_API_HEALTHY
  ]
};

/**
 * Redis Event Bus Test Controller
 * Provides programmatic control over test event generation
 */
export class RedisEventBusTestController {
  private eventHandlers: ((event: AgentUpdate) => void)[] = [];
  private isTestMode = false;
  private testInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Make test controller available globally for browser console access
    (window as any).redisTestController = this;
  }

  /**
   * Register an event handler (typically the useRedisEventBus callback)
   */
  addEventHandler(handler: (event: AgentUpdate) => void) {
    this.eventHandlers.push(handler);
  }

  /**
   * Send a single test event
   */
  sendTestEvent(event: AgentUpdate) {
    console.log('🧪 Sending test Redis event:', event);
    this.eventHandlers.forEach(handler => handler(event));
  }

  /**
   * Send a predefined test scenario
   */
  sendTestScenario(scenario: AgentUpdate[], delayMs = 1000) {
    console.log(`🎬 Running test scenario with ${scenario.length} events (${delayMs}ms delay)`);
    
    scenario.forEach((event, index) => {
      setTimeout(() => {
        this.sendTestEvent({
          ...event,
          ts: new Date().toISOString(), // Update timestamp
          id: `${event.id}-${Date.now()}-${index}` // Unique ID
        });
      }, index * delayMs);
    });
  }

  /**
   * Start continuous test mode (simulates real Redis stream)
   */
  startTestMode(intervalMs = 5000) {
    if (this.isTestMode) {
      console.warn('Test mode already running');
      return;
    }

    this.isTestMode = true;
    console.log(`🔄 Starting Redis Event Bus test mode (${intervalMs}ms intervals)`);

    const events = Object.values(TEST_EVENTS);
    let eventIndex = 0;

    this.testInterval = setInterval(() => {
      const event = events[eventIndex % events.length];
      this.sendTestEvent({
        ...event,
        ts: new Date().toISOString(),
        id: `${event.id}-${Date.now()}`
      });
      eventIndex++;
    }, intervalMs);
  }

  /**
   * Stop test mode
   */
  stopTestMode() {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
    this.isTestMode = false;
    console.log('⏹️ Redis Event Bus test mode stopped');
  }

  /**
   * Get test mode status
   */
  getStatus() {
    return {
      isTestMode: this.isTestMode,
      handlerCount: this.eventHandlers.length,
      availableEvents: Object.keys(TEST_EVENTS),
      availableScenarios: Object.keys(TEST_SCENARIOS)
    };
  }

  /**
   * Generate a custom test event
   */
  createCustomEvent(
    stepId: string, 
    status: 'healthy' | 'warning' | 'error' | 'unknown',
    responseTime: number,
    message?: string
  ): AgentUpdate {
    return {
      id: `custom-${stepId}-${Date.now()}`,
      agent: `${stepId}-test-agent`,
      msg: `step:${stepId} status:${status} responseTime:${responseTime} ${message || 'Custom test event'}`,
      ts: new Date().toISOString(),
      type: 'tebra_health_check',
      correlationId: `custom-${Date.now()}`
    };
  }
}

/**
 * Utility functions for Redis Event Bus debugging
 */
export const RedisEventBusDebugUtils = {
  /**
   * Validate event structure
   */
  validateEvent(event: AgentUpdate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!event.id) errors.push('Missing event ID');
    if (!event.agent) errors.push('Missing agent name');
    if (!event.msg) errors.push('Missing message');
    if (!event.ts) errors.push('Missing timestamp');
    if (!event.type) errors.push('Missing event type');

    // Validate timestamp format
    if (event.ts && isNaN(new Date(event.ts).getTime())) {
      errors.push('Invalid timestamp format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Parse message for Tebra-specific information
   */
  parseTebraMessage(msg: string): {
    stepId?: string;
    status?: string;
    responseTime?: number;
    description?: string;
  } {
    const stepMatch = msg.match(/step:(\w+)/);
    const statusMatch = msg.match(/status:(\w+)/);
    const timeMatch = msg.match(/responseTime:(\d+)/);
    
    return {
      stepId: stepMatch?.[1],
      status: statusMatch?.[1],
      responseTime: timeMatch ? parseInt(timeMatch[1], 10) : undefined,
      description: msg.replace(/step:\w+|status:\w+|responseTime:\d+/g, '').trim()
    };
  },

  /**
   * Convert AgentUpdate to TebraRealtimeUpdate
   */
  convertToTebraUpdate(event: AgentUpdate): TebraRealtimeUpdate | null {
    const parsed = this.parseTebraMessage(event.msg);
    
    if (!parsed.stepId || !parsed.status) {
      return null;
    }

    return {
      stepId: parsed.stepId,
      status: parsed.status as 'healthy' | 'warning' | 'error' | 'unknown',
      responseTime: parsed.responseTime || 0,
      message: parsed.description || event.msg,
      timestamp: new Date(event.ts),
      correlationId: event.correlationId || event.id
    };
  },

  /**
   * Generate performance metrics from event history
   */
  analyzeEventHistory(events: AgentUpdate[]): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    averageResponseTime: number;
    healthyPercentage: number;
    timeRange: { start: Date; end: Date } | null;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Parse and count by status
      const parsed = this.parseTebraMessage(event.msg);
      if (parsed.status) {
        eventsByStatus[parsed.status] = (eventsByStatus[parsed.status] || 0) + 1;
      }

      // Sum response times
      if (parsed.responseTime !== undefined) {
        totalResponseTime += parsed.responseTime;
        responseTimeCount++;
      }
    });

    const healthyCount = eventsByStatus.healthy || 0;
    const healthyPercentage = events.length > 0 ? (healthyCount / events.length) * 100 : 0;

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByStatus,
      averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
      healthyPercentage,
      timeRange: events.length > 0 ? {
        start: new Date(Math.min(...events.map(e => new Date(e.ts).getTime()))),
        end: new Date(Math.max(...events.map(e => new Date(e.ts).getTime())))
      } : null
    };
  }
};

// Global test controller instance
export const redisTestController = new RedisEventBusTestController();

// Browser console helpers
if (typeof window !== 'undefined') {
  (window as any).redisEventBusTest = {
    // Quick test functions
    sendHealthyEvent: () => redisTestController.sendTestEvent(TEST_EVENTS.TEBRA_API_HEALTHY),
    sendWarningEvent: () => redisTestController.sendTestEvent(TEST_EVENTS.TEBRA_API_WARNING),
    sendErrorEvent: () => redisTestController.sendTestEvent(TEST_EVENTS.TEBRA_API_ERROR),
    
    // Scenario functions
    runHealthyScenario: () => redisTestController.sendTestScenario(TEST_SCENARIOS.ALL_HEALTHY),
    runDegradationScenario: () => redisTestController.sendTestScenario(TEST_SCENARIOS.PARTIAL_DEGRADATION),
    runOutageScenario: () => redisTestController.sendTestScenario(TEST_SCENARIOS.MAJOR_OUTAGE),
    runRecoveryScenario: () => redisTestController.sendTestScenario(TEST_SCENARIOS.RECOVERY_SEQUENCE),
    
    // Control functions
    startTestMode: (intervalMs?: number) => redisTestController.startTestMode(intervalMs),
    stopTestMode: () => redisTestController.stopTestMode(),
    getStatus: () => redisTestController.getStatus(),
    
    // Custom events
    createCustomEvent: (stepId: string, status: string, responseTime: number, message?: string) => 
      redisTestController.createCustomEvent(stepId, status as any, responseTime, message),
    
    // Analysis tools
    analyzeEvents: (events: AgentUpdate[]) => RedisEventBusDebugUtils.analyzeEventHistory(events),
    validateEvent: (event: AgentUpdate) => RedisEventBusDebugUtils.validateEvent(event),
    
    // Available test data
    getTestEvents: () => TEST_EVENTS,
    getTestScenarios: () => TEST_SCENARIOS
  };

  console.log('🧪 Redis Event Bus testing utilities loaded:');
  console.log('  redisEventBusTest.sendHealthyEvent() - Send healthy test event');
  console.log('  redisEventBusTest.runOutageScenario() - Simulate system outage');
  console.log('  redisEventBusTest.startTestMode() - Start continuous testing');
  console.log('  redisEventBusTest.getStatus() - Check test controller status');
}