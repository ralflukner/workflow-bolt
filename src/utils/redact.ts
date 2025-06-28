/**
 * Frontend-safe utility to redact sensitive information from log messages
 * This works in browser environments without Node.js dependencies
 */

/**
 * Redacts common secret patterns from input strings
 * @param input - The string to redact
 * @returns The string with sensitive patterns replaced with [REDACTED]
 */
export function redactSecrets(input: string): string {
  if (!input || typeof input !== 'string') {
    return input;
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
 * @param input - The string to redact
 * @param sensitiveValues - Array of sensitive values to redact
 * @returns The string with sensitive values replaced with [REDACTED]
 */
export function redactSpecificValues(input: string, sensitiveValues: string[]): string {
  if (!input || typeof input !== 'string') {
    return input;
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
 * @param message - The message to log
 * @param data - Optional data to log (will be redacted)
 */
export function secureLog(message: string, data?: unknown): void {
  const redactedMessage = redactSecrets(message);
  
  if (data) {
    if (typeof data === 'string') {
      console.log(`[SECURE] ${redactedMessage}`, redactSecrets(data));
    } else if (typeof data === 'object') {
      // Serialize object and redact sensitive values so developers can still inspect structure
      try {
        const json = JSON.stringify(data, null, 2);
        const safeJson = redactSecrets(json);
        console.log(`[SECURE] ${redactedMessage}`, safeJson);
      } catch {
        // Fallback if circular structure prevents serialization
        console.log(`[SECURE] ${redactedMessage}`, '[Object (could not serialize) - details redacted]');
      }
    } else {
      console.log(`[SECURE] ${redactedMessage}`, '[Data redacted for security]');
    }
  } else {
    console.log(`[SECURE] ${redactedMessage}`);
  }
} 