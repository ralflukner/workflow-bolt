import { describe, it, expect } from '@jest/globals';
import { redactSecrets, redactSpecificValues, secureLog } from '../redact';

describe('Frontend-Safe Redaction Utility', () => {
  describe('redactSecrets', () => {
    it('should redact password patterns', () => {
      const input = 'Sending password=12345 and token=abcdef';
      const output = redactSecrets(input);
      
      expect(output).toContain('[REDACTED]');
      expect(output).not.toContain('12345');
      expect(output).not.toContain('abcdef');
    });

    it('should redact secret patterns', () => {
      const input = 'Using secret: mysecret123';
      const output = redactSecrets(input);
      
      expect(output).toContain('[REDACTED]');
      expect(output).not.toContain('mysecret123');
    });

    it('should redact API key patterns', () => {
      const input = 'API key=sk-1234567890';
      const output = redactSecrets(input);
      
      expect(output).toContain('[REDACTED]');
      expect(output).not.toContain('sk-1234567890');
    });

    it('should handle empty or invalid input', () => {
      expect(redactSecrets('')).toBe('');
      expect(redactSecrets(null as any)).toBe(null);
      expect(redactSecrets(undefined as any)).toBe(undefined);
    });
  });

  describe('redactSpecificValues', () => {
    it('should redact specific sensitive values', () => {
      const message = 'User: john@example.com, Password: secret123';
      const sensitiveValues = ['john@example.com', 'secret123'];
      const result = redactSpecificValues(message, sensitiveValues);
      
      expect(result).not.toContain('john@example.com');
      expect(result).not.toContain('secret123');
      expect(result).toContain('[REDACTED]');
    });

    it('should handle empty sensitive values array', () => {
      const message = 'No secrets here';
      const result = redactSpecificValues(message, []);
      
      expect(result).toBe('No secrets here');
    });

    it('should handle empty strings in sensitive values', () => {
      const message = 'Password: secret123';
      const sensitiveValues = ['', 'secret123'];
      const result = redactSpecificValues(message, sensitiveValues);
      
      expect(result).not.toContain('secret123');
      expect(result).toContain('[REDACTED]');
    });
  });

  describe('secureLog', () => {
    let consoleSpy: jest.SpiedFunction<typeof console.log>;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log messages with SECURE prefix', () => {
      secureLog('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith('[SECURE] Test message');
    });

    it('should redact sensitive data in logged messages', () => {
      secureLog('Connecting with password=secret123');
      
      expect(consoleSpy).toHaveBeenCalledWith('[SECURE] Connecting with password=[REDACTED]');
    });

    it('should handle object data safely', () => {
      secureLog('Processing data', { sensitive: 'data' });
      
      expect(consoleSpy).toHaveBeenCalledWith('[SECURE] Processing data', '[Object - details redacted for security]');
    });

    it('should handle string data with redaction', () => {
      secureLog('Response received', 'token=abc123');
      
      expect(consoleSpy).toHaveBeenCalledWith('[SECURE] Response received', 'token=[REDACTED]');
    });
  });
}); 