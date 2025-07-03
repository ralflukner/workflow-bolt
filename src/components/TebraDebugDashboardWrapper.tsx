import React, { useCallback, useEffect, useState } from 'react';
import { useRedisEventBus, AgentUpdate } from '../hooks/useRedisEventBus';
import TebraDebugDashboardContainer, { TebraRealtimeUpdate } from './TebraDebugDashboardContainer';
import { StepStatus } from '../constants/tebraDebug';

// Use the exported interface from TebraDebugDashboardContainer
type TebraUpdate = TebraRealtimeUpdate;

/**
 * Wrapper component that integrates Redis Event Bus with Tebra Debug Dashboard
 * Replaces 30-second polling with real-time Redis event updates
 */
// Use global window reference for dashboard communication

export default function TebraDebugDashboardWrapper() {
  const [realtimeUpdates, setRealtimeUpdates] = useState<TebraUpdate[]>([]);

  // Map Redis AgentUpdate to Tebra health check updates
  const mapRedisEventToTebraUpdate = useCallback((update: AgentUpdate): TebraUpdate | null => {
    // Look for Tebra-related updates in the Redis stream
    if (update.type === 'tebra_health_check' || update.msg.toLowerCase().includes('tebra')) {
      // Parse the message to extract step information
      let stepId = 'unknown';
      let status: StepStatus = 'warning';
      let responseTime = 0;

      try {
        // Try to parse structured data from the message
        if (update.msg.includes('step:')) {
          const stepMatch = update.msg.match(/step:(\w+)/);
          stepId = stepMatch?.[1] || 'unknown';
        }

        if (update.msg.includes('status:')) {
          const statusMatch = update.msg.match(/status:(\w+)/);
          const statusStr = statusMatch?.[1];
          status = ['healthy', 'warning', 'error', 'unknown'].includes(statusStr || '') 
            ? statusStr as StepStatus 
            : 'warning';
        }

        if (update.msg.includes('responseTime:')) {
          const timeMatch = update.msg.match(/responseTime:(\d+)/);
          responseTime = parseInt(timeMatch?.[1] || '0', 10);
        }

        // Map agent types to step IDs
        if (update.agent.includes('firebase')) stepId = 'firebase_functions';
        else if (update.agent.includes('proxy')) stepId = 'tebra_proxy';
        else if (update.agent.includes('php')) stepId = 'cloud_run';
        else if (update.agent.includes('tebra')) stepId = 'tebra_api';

      } catch (error) {
        console.warn('Failed to parse Redis event for Tebra update:', error);
        return null;
      }

      return {
        stepId,
        status,
        responseTime,
        message: update.msg,
        timestamp: new Date(update.ts),
        correlationId: update.correlationId || update.id
      };
    }

    return null;
  }, []);

  // Handle Redis event updates
  const handleRedisUpdate = useCallback((update: AgentUpdate) => {
    console.log('📡 Redis Event Bus update received:', update);
    
    const tebraUpdate = mapRedisEventToTebraUpdate(update);
    if (tebraUpdate) {
      console.log('🔄 Mapped to Tebra update:', tebraUpdate);
      
      setRealtimeUpdates(prev => [...prev, tebraUpdate].slice(-50)); // Keep last 50 updates
      
      // Trigger dashboard update if dashboard is available
      const dashboardInstance = (window as any).globalTebraDebugDashboard;
      if (dashboardInstance) {
        // Force dashboard to incorporate real-time data
        if (typeof dashboardInstance.handleRealtimeUpdate === 'function') {
          dashboardInstance.handleRealtimeUpdate(tebraUpdate);
        } else {
          // Fallback: trigger a health check to incorporate new data
          dashboardInstance.runHealthChecks();
        }
      }
    }
  }, [mapRedisEventToTebraUpdate]);

  // Subscribe to Redis Event Bus
  useRedisEventBus(handleRedisUpdate);

  // Auto-reduce polling frequency when Redis events are active
  useEffect(() => {
    const recentUpdates = realtimeUpdates.filter(
      update => Date.now() - update.timestamp.getTime() < 60000 // Last minute
    );

    const dashboardInstance = (window as any).globalTebraDebugDashboard;
    if (dashboardInstance && recentUpdates.length > 0) {
      // If we have recent Redis updates, we can reduce polling frequency
      console.log(`🚀 Redis Event Bus active: ${recentUpdates.length} updates in last minute. Reducing polling.`);
      
      // Dashboard already handles dynamic polling intervals in startInterval()
    }
  }, [realtimeUpdates]);

  // Provide debug information to browser console
  useEffect(() => {
    (window as any).tebraRedisDebug = {
      getRealtimeUpdates: () => realtimeUpdates,
      getUpdateCount: () => realtimeUpdates.length,
      clearUpdates: () => setRealtimeUpdates([]),
      triggerTestUpdate: () => {
        const testUpdate: AgentUpdate = {
          id: 'test-' + Date.now(),
          agent: 'tebra-test-agent',
          msg: 'step:tebra_api status:healthy responseTime:150 Test update from Redis Event Bus',
          ts: new Date().toISOString(),
          type: 'tebra_health_check',
          correlationId: 'test-correlation-' + Date.now()
        };
        handleRedisUpdate(testUpdate);
      }
    };
  }, [realtimeUpdates, handleRedisUpdate]);

  return (
    <div className="relative">
      {/* Redis Event Bus Status Indicator */}
      {realtimeUpdates.length > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span>Redis Events: {realtimeUpdates.length}</span>
          </div>
        </div>
      )}

      {/* Original Tebra Debug Dashboard */}
      <TebraDebugDashboardContainer />

      {/* Recent Redis Updates Debug Panel (hidden by default) */}
      {process.env.NODE_ENV === 'development' && realtimeUpdates.length > 0 && (
        <div className="mt-4 bg-gray-900 border border-gray-600 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Recent Redis Events ({realtimeUpdates.slice(-5).length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {realtimeUpdates.slice(-5).map((update, idx) => (
              <div key={idx} className="text-xs text-gray-300 bg-gray-800 p-2 rounded">
                <span className="text-blue-400">{update.stepId}</span> • 
                <span className={`ml-1 ${
                  update.status === 'healthy' ? 'text-green-400' :
                  update.status === 'warning' ? 'text-yellow-400' :
                  update.status === 'error' ? 'text-red-400' : 'text-gray-400'
                }`}>{update.status}</span> • 
                <span className="text-gray-400 ml-1">{update.responseTime}ms</span>
                <div className="text-gray-500 truncate">{update.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}