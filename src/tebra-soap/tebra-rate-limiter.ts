/**
 * @fileoverview Rate limiter for Tebra API calls
 * @module services/tebra/tebra-rate-limiter
 */

/**
 * Rate limiter configuration interface
 * @interface RateLimiterConfig
 */
interface RateLimiterConfig {
  /** Maximum number of requests per window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Default rate limiter configuration
 * @constant
 */
const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
};

// Simple async lock implementation
class AsyncLock {
  private _locked: boolean = false;
  private _waiting: (() => void)[] = [];

  async acquire(): Promise<void> {
    if (!this._locked) {
      this._locked = true;
      return;
    }
    return new Promise(resolve => {
      this._waiting.push(resolve);
    });
  }

  release(): void {
    if (this._waiting.length > 0) {
      const next = this._waiting.shift();
      if (next) next();
    } else {
      this._locked = false;
    }
  }
}

/**
 * Rate limiter for Tebra API calls
 * Implements the specific rate limits documented by Tebra
 */
export class TebraRateLimiter {
  private config: RateLimiterConfig;
  private requestCounts: Map<string, number[]>;
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

  private methodLocks: Record<string, AsyncLock> = {};

  /**
   * Creates an instance of TebraRateLimiter
   * @param {Partial<RateLimiterConfig>} [config] - Optional configuration override
   */
  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.requestCounts = new Map();
  }

  /**
   * Waits for a rate limit slot to become available
   * @param {string} method - API method name
   * @returns {Promise<void>} Resolves when a slot is available
   */
  public async waitForSlot(method: string): Promise<void> {
    if (!this.methodLocks[method]) this.methodLocks[method] = new AsyncLock();
    const lock = this.methodLocks[method];
    await lock.acquire();
    try {
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      // Get or initialize request timestamps for this method
      const timestamps = this.requestCounts.get(method) || [];
      
      // Remove timestamps outside the current window
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      
      // If we're at the limit, wait until the oldest request expires
      if (validTimestamps.length >= this.config.maxRequests) {
        const oldestTimestamp = validTimestamps[0];
        const waitTime = this.config.windowMs - (now - oldestTimestamp);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Add current timestamp
      validTimestamps.push(now);
      this.requestCounts.set(method, validTimestamps);
    } finally {
      lock.release();
    }
  }

  /**
   * Gets the current request count for a method
   * @param {string} method - API method name
   * @returns {number} Current request count
   */
  public getRequestCount(method: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const timestamps = this.requestCounts.get(method) || [];
    return timestamps.filter(timestamp => timestamp > windowStart).length;
  }

  /**
   * Resets the rate limiter for a method
   * @param {string} method - API method name
   */
  public reset(method: string): void {
    this.requestCounts.delete(method);
  }

  /**
   * Resets all rate limiters
   */
  public resetAll(): void {
    this.requestCounts.clear();
  }

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
   * Sleep for a specified number of milliseconds
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const tebraRateLimiter = new TebraRateLimiter(); 