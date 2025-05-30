/**
 * Rate limiter for Tebra API calls
 * Implements the specific rate limits documented by Tebra
 */
export class TebraRateLimiter {
  private lastCallTimes: Map<string, number> = new Map();
  
  // Rate limits in milliseconds for each API method
  private readonly rateLimits: Record<string, number> = {
    // Read operations
    'GetAllPatients': 5000,      // 1 call every 5 seconds
    'GetAppointment': 500,       // 1 call every ½ second
    'GetAppointments': 1000,     // 1 call per second
    'GetCharges': 1000,          // 1 call per second
    'GetEncounterDetails': 500,  // 1 call every ½ second
    'GetExternalVendors': 1000,  // 1 call per second
    'GetPatient': 250,           // 1 call every ¼ second
    'GetPatients': 1000,         // 1 call per second
    'GetPayments': 1000,         // 1 call per second
    'GetPractices': 500,         // 1 call every ½ second
    'GetProcedureCode': 500,     // 1 call every ½ second
    'GetProviders': 500,         // 1 call every ½ second
    'GetServiceLocations': 500,  // 1 call every ½ second
    'GetThrottles': 5000,        // 1 call every 5 seconds
    'GetTransactions': 1000,     // 1 call per second
    
    // Write operations
    'CreateAppointment': 500,    // 1 call every ½ second
    'CreateEncounter': 500,      // 1 call every ½ second
    'CreatePatient': 500,        // 1 call every ½ second
    'CreatePayments': 500,       // 1 call every ½ second
    'UpdateAppointment': 500,    // 1 call every ½ second
    'UpdateEncounterStatus': 500, // 1 call every ½ second
    'UpdatePatient': 1000,       // 1 call per second
    'DeleteAppointment': 500,    // 1 call every ½ second
    
    // Search operations
    'SearchPatient': 250,        // 1 call every ¼ second
  };

  /**
   * Wait for the appropriate time before making an API call
   * @param methodName The Tebra API method name
   */
  async waitForRateLimit(methodName: string): Promise<void> {
    const rateLimit = this.rateLimits[methodName];
    if (!rateLimit) {
      console.warn(`No rate limit defined for method: ${methodName}`);
      return;
    }

    const lastCallTime = this.lastCallTimes.get(methodName) || 0;
    const timeSinceLastCall = Date.now() - lastCallTime;
    const waitTime = rateLimit - timeSinceLastCall;

    if (waitTime > 0) {
      console.log(`Rate limiting ${methodName}: waiting ${waitTime}ms`);
      await this.sleep(waitTime);
    }

    // Update the last call time
    this.lastCallTimes.set(methodName, Date.now());
  }

  /**
   * Get the rate limit for a specific method
   * @param methodName The Tebra API method name
   * @returns Rate limit in milliseconds
   */
  getRateLimit(methodName: string): number {
    return this.rateLimits[methodName] || 1000; // Default to 1 second if not found
  }

  /**
   * Get all available rate limits
   * @returns Object with all method rate limits
   */
  getAllRateLimits(): Record<string, number> {
    return { ...this.rateLimits };
  }

  /**
   * Check if a method can be called immediately without waiting
   * @param methodName The Tebra API method name
   * @returns True if the method can be called immediately
   */
  canCallImmediately(methodName: string): boolean {
    const rateLimit = this.rateLimits[methodName];
    if (!rateLimit) return true;

    const lastCallTime = this.lastCallTimes.get(methodName) || 0;
    const timeSinceLastCall = Date.now() - lastCallTime;
    
    return timeSinceLastCall >= rateLimit;
  }

  /**
   * Get the remaining wait time for a method
   * @param methodName The Tebra API method name
   * @returns Remaining wait time in milliseconds, or 0 if no wait needed
   */
  getRemainingWaitTime(methodName: string): number {
    const rateLimit = this.rateLimits[methodName];
    if (!rateLimit) return 0;

    const lastCallTime = this.lastCallTimes.get(methodName) || 0;
    const timeSinceLastCall = Date.now() - lastCallTime;
    const waitTime = rateLimit - timeSinceLastCall;

    return Math.max(0, waitTime);
  }

  /**
   * Reset rate limits for all methods (useful for testing)
   */
  reset(): void {
    this.lastCallTimes.clear();
  }

  /**
   * Reset rate limit for a specific method
   * @param methodName The Tebra API method name
   */
  resetMethod(methodName: string): void {
    this.lastCallTimes.delete(methodName);
  }

  /**
   * Sleep for a specified number of milliseconds
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const tebraRateLimiter = new TebraRateLimiter(); 