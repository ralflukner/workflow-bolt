const crypto = require('crypto');

class DebugLogger {
  constructor(component = 'Unknown') {
    this.component = component;
    this.correlationId = this.generateCorrelationId();
    this.startTime = Date.now();
    this.stepCounter = 0;
  }

  generateCorrelationId() {
    return crypto.randomBytes(8).toString('hex');
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    this.stepCounter++;

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      component: this.component,
      correlationId: this.correlationId,
      step: this.stepCounter,
      elapsedMs: elapsed,
      message,
      // Add human-readable text field for readability
      text: `[${level.toUpperCase()}] ${this.component}:${this.correlationId}:${this.stepCounter} (+${elapsed}ms) ${message}`,
      ...data
    };

    // Use appropriate console method based on level
    const logMethod = {
      'error': console.error,
      'warn': console.warn,
      'info': console.log,
      'debug': console.log
    }[level] || console.log;

    // Emit the entire logEntry object as the first argument to preserve structured fields
    logMethod(logEntry);
  }

  info(message, data = {}) { this.log('info', message, data); }
  warn(message, data = {}) { this.log('warn', message, data); }
  error(message, data = {}) { this.log('error', message, data); }
  debug(message, data = {}) { this.log('debug', message, data); }

  // Special method for API calls
  apiCall(method, url, headers = {}, body = null) {
    this.info(`API Call: ${method} ${url}`, {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      bodySize: body ? JSON.stringify(body).length : 0,
      hasBody: !!body
    });
  }

  // Special method for API responses
  apiResponse(status, data = null, error = null) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API Response: ${status}`, {
      status,
      dataSize: data ? JSON.stringify(data).length : 0,
      hasData: !!data,
      error: error ? error.message : null,
      errorStack: error ? error.stack : null
    });
  }

  // Sanitize sensitive headers for logging
  sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-api-key', 'cookie', 'x-firebase-appcheck'];
    
    sensitiveKeys.forEach(key => {
      const found = Object.keys(sanitized).find(k => k.toLowerCase() === key);
      if (found && sanitized[found]) {
        sanitized[found] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Method to track timing of operations
  time(operationName) {
    const startTime = Date.now();
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.info(`Operation completed: ${operationName}`, { 
          operation: operationName, 
          durationMs: duration 
        });
        return duration;
      }
    };
  }

  // Method to create child logger for sub-operations
  child(subComponent) {
    const child = new DebugLogger(`${this.component}:${subComponent}`);
    child.correlationId = this.correlationId; // Inherit correlation ID
    return child;
  }
}

module.exports = { DebugLogger }; 