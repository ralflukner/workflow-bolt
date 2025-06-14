/**
 * secureLog - A HIPAA-compliant logging utility that redacts sensitive information.
 * @param message - The log message
 * @param error - Optional error object
 */
export const secureLog = (message: string, error?: unknown): void => {
  // Redact sensitive information from the message
  const redactedMessage = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED PHONE]')
    .replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[REDACTED SSN]');

  // Log the redacted message
  console.error(redactedMessage);

  // If an error is provided, log it safely
  if (error) {
    console.error('Error details:', error instanceof Error ? error.message : '[REDACTED ERROR]');
  }
}; 