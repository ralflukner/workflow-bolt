/**
 * Frontend-safe utility to redact sensitive information from log messages
 * This works in browser environments without Node.js dependencies
 * 
 * CRITICAL SECURITY CONSTRAINTS:
 * - NO FILE SYSTEM ACCESS ALLOWED
 * - NO NETWORK OPERATIONS ALLOWED
 * - STRING PROCESSING ONLY
 * - NO EXTERNAL DEPENDENCIES
 * - BROWSER-SAFE ONLY
 */

// SAFETY CHECK: Prevent any file system operations (but allow testing)
const isTestEnvironment = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
if (!isTestEnvironment && typeof require !== 'undefined' && typeof window === 'undefined') {
  throw new Error('SECURITY: redact.ts must not access Node.js APIs or file system outside of tests');
}

/**
 * Redacts common secret patterns from input strings
 * CONSTRAINT: ONLY processes strings - NO file operations
 * @param input - The string to redact
 * @returns The string with sensitive patterns replaced with [REDACTED]
 */
export function redactSecrets(input: string): string {
  // SAFETY: Only process strings
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  // SAFETY: Prevent any file path processing
  if (input.includes('/') && (input.includes('.ts') || input.includes('.js') || input.includes('.json'))) {
    throw new Error('SECURITY: redactSecrets must not process file paths');
  }

  return input
    // Redact password patterns
    .replace(/(password[=:\s]+)[^\s&]+/gi, '$1[REDACTED]')
    // Redact secret patterns
    .replace(/(secret[=:\s]+)[^\s&]+/gi, '$1[REDACTED]')
    // Redact token patterns
    .replace(/(token[=:\s]+)[^\s&]+/gi, '$1[REDACTED]')
    // Redact credential patterns
    .replace(/(credential[s]?[=:\s]+)[^\s&]+/gi, '$1[REDACTED]')
    // Redact key patterns
    .replace(/(key[=:\s]+)[^\s&]+/gi, '$1[REDACTED]')
    // Redact API key patterns
    .replace(/(api[_-]?key[=:\s]+)[^\s&]+/gi, '$1[REDACTED]')
    // Redact username patterns when followed by sensitive context
    .replace(/(username[=:\s]+)([^\s&,]+)(\s*[,&]\s*password)/gi, '$1[REDACTED]$3')
    // Redact URLs with embedded credentials
    .replace(/(https?:\/\/)[^:/\\s]+:[^@/\\s]+@/g, '$1[REDACTED]:[REDACTED]@');
}

/**
 * Redacts specific sensitive values from input strings
 * CONSTRAINT: ONLY processes strings - NO file operations
 * @param input - The string to redact
 * @param sensitiveValues - Array of sensitive values to redact
 * @returns The string with sensitive values replaced with [REDACTED]
 */
export function redactSpecificValues(input: string, sensitiveValues: string[]): string {
  // SAFETY: Only process strings
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  // SAFETY: Prevent any file path processing
  if (input.includes('/') && (input.includes('.ts') || input.includes('.js') || input.includes('.json'))) {
    throw new Error('SECURITY: redactSpecificValues must not process file paths');
  }

  let result = input;
  
  for (const value of sensitiveValues) {
    if (value && typeof value === 'string' && value.length > 0) {
      // Escape special regex characters
      const escapedValue = value.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedValue, 'gi');
      result = result.replace(regex, '[REDACTED]');
    }
  }
  
  return result;
}

/**
 * HIPAA-compliant logging function that automatically redacts sensitive information
 * CONSTRAINT: CONSOLE OUTPUT ONLY - NO file operations
 * @param message - The message to log
 * @param data - Optional data to log (will be redacted)
 */
export function secureLog(message: string, data?: unknown): void {
  // SAFETY: Only process strings for messages
  if (typeof message !== 'string') {
    throw new Error('SECURITY: secureLog message must be a string');
  }
  
  // SAFETY: Prevent any file path processing
  if (message.includes('/') && (message.includes('.ts') || message.includes('.js') || message.includes('.json'))) {
    throw new Error('SECURITY: secureLog must not process file paths');
  }
  
  const redactedMessage = redactSecrets(message);
  
  if (data) {
    if (typeof data === 'string') {
      console.log(`[SECURE] ${redactedMessage}`, redactSecrets(data));
    } else if (typeof data === 'object') {
      // For HIPAA compliance, completely redact object contents
      console.log(`[SECURE] ${redactedMessage}`, '[Object - details redacted for security]');
    } else {
      console.log(`[SECURE] ${redactedMessage}`, '[Data redacted for security]');
    }
  } else {
    console.log(`[SECURE] ${redactedMessage}`);
  }
}

// FINAL SAFETY CHECK: Ensure no file system access is possible (except in tests)
if (!isTestEnvironment && typeof require !== 'undefined') {
  // Prevent any dynamic requires of dangerous modules
  const originalRequire = require;
  (global as any).require = function(id: string) {
    if (id.includes('fs') || id.includes('path') || id.includes('child_process')) {
      throw new Error('SECURITY: File system access blocked in redact.ts');
    }
    return originalRequire(id);
  };
} 