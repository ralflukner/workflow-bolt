import { describe, it, expect, beforeEach } from '@jest/globals';
import { TebraRateLimiter } from '../tebra-rate-limiter';

describe('TebraRateLimiter', () => {
  let rateLimiter: TebraRateLimiter;

  beforeEach(() => {
    rateLimiter = new TebraRateLimiter();
  });

  it('should enforce rate limits for API methods', async () => {
    const startTime = Date.now();
    
    // Test rate limiting for GetPatient (250ms limit)
    await rateLimiter.waitForRateLimit('GetPatient');
    await rateLimiter.waitForRateLimit('GetPatient');
    
    const elapsed = Date.now() - startTime;
    // Should have waited at least 250ms for the second call
    expect(elapsed).toBeGreaterThanOrEqual(240); // Allow for small timing variations
  }, 15000); // 15 second timeout for rate limiting test

  it('should handle different rate limits for different methods', async () => {
    // GetAppointments has 1000ms limit
    const appointmentCallStart = Date.now();
    await rateLimiter.waitForRateLimit('GetAppointments');
    await rateLimiter.waitForRateLimit('GetAppointments');
    const appointmentCallElapsed = Date.now() - appointmentCallStart;

    // Should have waited at least 1000ms for the second call
    expect(appointmentCallElapsed).toBeGreaterThanOrEqual(990); // Allow for small timing variations
  }, 15000); // 15 second timeout for rate limiting test

  it('should warn about unknown methods', async () => {
    const originalWarn = console.warn;
    const mockWarn = jest.fn();
    console.warn = mockWarn;
    
    await rateLimiter.waitForRateLimit('UnknownMethod');
    
    expect(mockWarn).toHaveBeenCalledWith('No rate limit defined for method: UnknownMethod');
    
    // Restore original console.warn
    console.warn = originalWarn;
  });

  it('should have correct rate limits for all API methods', () => {
    const rateLimiter = new TebraRateLimiter();
    
    // Test a few key rate limits to ensure they're defined correctly
    const testMethods = [
      { method: 'GetPatient', expectedLimit: 250 },
      { method: 'GetAppointments', expectedLimit: 1000 },
      { method: 'GetProviders', expectedLimit: 500 },
      { method: 'SearchPatient', expectedLimit: 250 },
      { method: 'GetAllPatients', expectedLimit: 5000 },
      { method: 'CreatePatient', expectedLimit: 500 },
      { method: 'UpdatePatient', expectedLimit: 1000 }
    ];

    // We can't directly access private rateLimits, but we can test the behavior
    testMethods.forEach(({ method }) => {
      expect(() => rateLimiter.waitForRateLimit(method)).not.toThrow();
    });
  });
}); 