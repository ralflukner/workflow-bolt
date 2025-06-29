/**
 * Firebase Functions Health Monitoring and Metrics
 * 
 * This module provides structured logging and metrics collection for Firebase Functions
 * to help monitor performance, errors, and usage patterns.
 */

/**
 * Log a metric to Cloud Logging for monitoring
 * @param {Object} metric - The metric data
 * @param {string} metric.function - Function name
 * @param {string} metric.operation - Operation being performed
 * @param {number} metric.duration - Duration in milliseconds
 * @param {string} metric.status - 'success', 'error', 'warning'
 * @param {Object} [metric.metadata] - Additional metadata
 */
function logMetric(metric) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    severity: metric.status === 'error' ? 'ERROR' : 'INFO',
    type: 'FUNCTION_METRIC',
    function: metric.function,
    operation: metric.operation,
    duration_ms: metric.duration,
    status: metric.status,
    metadata: metric.metadata || {}
  };
  
  // Use structured logging for Cloud Logging
  console.log(JSON.stringify(logEntry));
}

/**
 * Log performance metrics for a function execution
 * @param {string} functionName - Name of the function
 * @param {string} operation - Operation being performed 
 * @param {number} startTime - Start time from Date.now()
 * @param {string} status - 'success' or 'error'
 * @param {Object} [metadata] - Additional metadata
 */
function logPerformanceMetric(functionName, operation, startTime, status = 'success', metadata = {}) {
  const duration = Date.now() - startTime;
  
  logMetric({
    function: functionName,
    operation: operation,
    duration: duration,
    status: status,
    metadata: {
      ...metadata,
      cold_start: metadata.coldStart || false,
      memory_used: process.memoryUsage().heapUsed,
      node_version: process.version
    }
  });
}

/**
 * Log an error with context for monitoring
 * @param {string} functionName - Name of the function
 * @param {string} operation - Operation that failed
 * @param {Error} error - The error that occurred
 * @param {Object} [context] - Additional context
 */
function logError(functionName, operation, error, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: 'ERROR',
    type: 'FUNCTION_ERROR',
    function: functionName,
    operation: operation,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context: context
  };
  
  console.error(JSON.stringify(logEntry));
}

/**
 * Log user activity for audit trail (HIPAA compliant)
 * @param {string} functionName - Name of the function
 * @param {string} userId - User identifier (hashed)
 * @param {string} action - Action performed
 * @param {Object} [metadata] - Additional metadata (NO PHI)
 */
function logUserActivity(functionName, userId, action, metadata = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: 'INFO',
    type: 'USER_ACTIVITY',
    function: functionName,
    user_id: userId, // Should be hashed/anonymized
    action: action,
    metadata: metadata // IMPORTANT: No PHI in metadata
  };
  
  console.log(JSON.stringify(logEntry));
}

/**
 * Middleware to wrap function execution with metrics
 * @param {string} functionName - Name of the function
 * @param {string} operation - Operation being performed
 * @returns {Function} Wrapper function
 */
function withMetrics(functionName, operation) {
  return function(fn) {
    return async function(...args) {
      const startTime = Date.now();
      const isColdStart = !global.functionInitialized;
      global.functionInitialized = true;
      
      try {
        const result = await fn(...args);
        
        logPerformanceMetric(functionName, operation, startTime, 'success', {
          coldStart: isColdStart
        });
        
        return result;
      } catch (error) {
        logPerformanceMetric(functionName, operation, startTime, 'error', {
          coldStart: isColdStart,
          error_type: error.name
        });
        
        logError(functionName, operation, error);
        throw error;
      }
    };
  };
}

/**
 * Health check utility for functions
 * @param {string} functionName - Name of the function
 * @returns {Object} Health status
 */
function getHealthStatus(functionName) {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    function: functionName,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptime,
    memory: {
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external_mb: Math.round(memoryUsage.external / 1024 / 1024)
    },
    node_version: process.version,
    platform: process.platform
  };
}

/**
 * Rate limiting metrics
 * @param {string} functionName - Name of the function
 * @param {string} identifier - Client identifier (IP, user ID, etc.)
 * @param {string} action - Action being rate limited
 */
function logRateLimitEvent(functionName, identifier, action) {
  logMetric({
    function: functionName,
    operation: 'rate_limit',
    duration: 0,
    status: 'warning',
    metadata: {
      identifier: identifier,
      action: action,
      type: 'rate_limit_exceeded'
    }
  });
}

/**
 * Security event logging
 * @param {string} functionName - Name of the function
 * @param {string} eventType - Type of security event
 * @param {Object} details - Event details (NO PHI)
 */
function logSecurityEvent(functionName, eventType, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: 'WARNING',
    type: 'SECURITY_EVENT',
    function: functionName,
    event_type: eventType,
    details: details
  };
  
  console.warn(JSON.stringify(logEntry));
}

module.exports = {
  logMetric,
  logPerformanceMetric,
  logError,
  logUserActivity,
  withMetrics,
  getHealthStatus,
  logRateLimitEvent,
  logSecurityEvent
};