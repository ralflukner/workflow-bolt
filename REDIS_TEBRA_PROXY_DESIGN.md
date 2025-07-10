# Redis-Based Tebra Proxy Architecture

## Executive Summary

This document outlines a Redis-based architecture to replace the current CORS-problematic Firebase Function approach for Tebra API integration. By leveraging the existing Redis infrastructure already used for multi-agent coordination, we can bypass CORS issues entirely while gaining additional benefits like queuing, retry logic, and real-time updates.

## Problem Statement

### Current Issues

1. **CORS 403 Errors**: Persistent preflight failures when calling `tebraProxy` Firebase Function
2. **Complex Auth Chain**: Browser → Firebase Auth → Firebase Function → PHP API
3. **No Retry Logic**: Direct HTTP calls fail immediately without retry
4. **No Queue Management**: Synchronous requests can timeout or overwhelm the system
5. **Limited Visibility**: No real-time status updates during long-running operations

### Root Cause

The Firebase Callable Function architecture requires CORS preflight checks which are failing despite proper configuration. This is blocking all Tebra integration functionality.

## Proposed Solution: Redis Event-Driven Architecture

### Architecture Overview

```
Browser → Redis Streams → Worker Service → PHP API
   ↑                                          ↓
   └──────── SSE Updates ←─── Redis ←────────┘
```

### Key Components

1. **Frontend (Browser)**
   - Publishes requests to Redis streams instead of HTTP calls
   - Receives real-time updates via existing SSE connection
   - No CORS issues as Redis communication happens server-side

2. **Redis Streams**
   - `tebra:requests` - Incoming API requests from frontend
   - `tebra:responses` - API responses and status updates
   - `tebra:status` - Real-time operation status

3. **Tebra Sync Worker**
   - Node.js service monitoring Redis streams
   - Processes requests asynchronously
   - Calls PHP Cloud Run API
   - Publishes responses back to Redis

4. **SSE Proxy** (Already Exists)
   - Monitors Redis streams
   - Pushes updates to connected browsers
   - No modifications needed

## Implementation Plan

### Phase 1: Redis Message Structure

```typescript
// Request Message
interface TebraRequest {
  id: string;              // Unique request ID
  action: string;          // e.g., 'syncSchedule', 'getPatients'
  params: Record<string, any>;
  userId: string;          // Firebase Auth UID
  timestamp: string;       // ISO timestamp
  correlationId: string;   // For request/response pairing
}

// Response Message
interface TebraResponse {
  id: string;              // Response ID
  requestId: string;       // Original request ID
  correlationId: string;   // Matching correlation ID
  status: 'pending' | 'processing' | 'success' | 'error';
  data?: any;              // API response data
  error?: string;          // Error message if failed
  timestamp: string;       // ISO timestamp
  duration?: number;       // Processing time in ms
}
```

### Phase 2: Frontend Service Update

```typescript
// src/services/tebraRedisApi.ts
import { v4 as uuidv4 } from 'uuid';

class TebraRedisApi {
  private redisClient: RedisClient;
  private pendingRequests: Map<string, Promise<any>>;

  async syncSchedule(params: { date: string }): Promise<ApiResponse> {
    const correlationId = uuidv4();
    
    // Publish request to Redis
    await this.publishRequest('syncSchedule', params, correlationId);
    
    // Wait for response via SSE
    return this.waitForResponse(correlationId);
  }

  private async publishRequest(action: string, params: any, correlationId: string) {
    const request: TebraRequest = {
      id: uuidv4(),
      action,
      params,
      userId: getCurrentUserId(),
      timestamp: new Date().toISOString(),
      correlationId
    };

    // Use existing Redis publish mechanism
    await this.redisClient.xadd('tebra:requests', request);
  }

  private waitForResponse(correlationId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout

      // Listen for response via SSE
      const unsubscribe = subscribeToRedisUpdates((update) => {
        if (update.stream === 'tebra:responses' && 
            update.data.correlationId === correlationId) {
          clearTimeout(timeout);
          unsubscribe();
          
          if (update.data.status === 'success') {
            resolve(update.data.data);
          } else {
            reject(new Error(update.data.error || 'Request failed'));
          }
        }
      });
    });
  }
}
```

### Phase 3: Worker Service

```javascript
// tebra-sync-worker.js
const Redis = require('redis');
const axios = require('axios');

class TebraSyncWorker {
  constructor() {
    this.redisClient = Redis.createClient({ url: process.env.REDIS_URL });
    this.phpApiUrl = process.env.TEBRA_PHP_API_URL;
    this.apiKey = process.env.TEBRA_INTERNAL_API_KEY;
  }

  async start() {
    await this.redisClient.connect();
    console.log('✅ Tebra Sync Worker started');

    // Monitor request stream
    while (true) {
      try {
        const results = await this.redisClient.xRead(
          [{ key: 'tebra:requests', id: '$' }],
          { BLOCK: 5000, COUNT: 1 }
        );

        if (results && results.length > 0) {
          for (const message of results[0].messages) {
            await this.processRequest(message);
          }
        }
      } catch (error) {
        console.error('Worker error:', error);
        await this.sleep(5000);
      }
    }
  }

  async processRequest(message) {
    const request = message.message;
    const startTime = Date.now();

    // Send processing status
    await this.publishStatus(request.correlationId, 'processing');

    try {
      // Call PHP API
      const response = await axios.post(
        this.phpApiUrl,
        {
          action: request.action,
          params: request.params
        },
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Publish success response
      await this.publishResponse({
        requestId: request.id,
        correlationId: request.correlationId,
        status: 'success',
        data: response.data,
        duration: Date.now() - startTime
      });

    } catch (error) {
      // Publish error response
      await this.publishResponse({
        requestId: request.id,
        correlationId: request.correlationId,
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  }

  async publishResponse(response) {
    await this.redisClient.xadd('tebra:responses', {
      ...response,
      id: uuidv4(),
      timestamp: new Date().toISOString()
    });
  }

  async publishStatus(correlationId, status) {
    await this.redisClient.xadd('tebra:status', {
      correlationId,
      status,
      timestamp: new Date().toISOString()
    });
  }
}

// Start worker
const worker = new TebraSyncWorker();
worker.start().catch(console.error);
```

## Benefits

### 1. **No CORS Issues**

- All communication happens server-side via Redis
- Browser only needs to connect to SSE proxy (already working)

### 2. **Asynchronous Processing**

- Requests are queued and processed asynchronously
- No timeout issues for long-running operations
- Can handle multiple requests in parallel

### 3. **Retry Logic**

- Worker can implement sophisticated retry strategies
- Failed requests can be requeued automatically
- Circuit breaker patterns for API protection

### 4. **Real-time Updates**

- Users see live status updates during processing
- Progress indicators for long operations
- Immediate error notifications

### 5. **Scalability**

- Multiple workers can process requests in parallel
- Redis handles message distribution automatically
- Easy to scale horizontally

### 6. **Audit Trail**

- All requests/responses logged in Redis streams
- HIPAA-compliant audit logging
- Easy to implement request history

### 7. **Simplified Architecture**

- Removes complex Firebase Function layer
- Direct worker-to-API communication
- Easier to debug and monitor

## Migration Strategy

### Step 1: Implement Worker Service (2 hours)

- Create basic worker that monitors Redis streams
- Test with simple echo responses
- Deploy as background process

### Step 2: Update Frontend Service (2 hours)

- Create `tebraRedisApi.ts` service
- Implement request publishing
- Add response handling via SSE

### Step 3: Parallel Testing (1 hour)

- Run both Firebase and Redis implementations
- Compare results and performance
- Identify any edge cases

### Step 4: Gradual Migration (2 hours)

- Switch one API method at a time
- Monitor for issues
- Full cutover once stable

### Step 5: Cleanup (1 hour)

- Remove Firebase Function code
- Update documentation
- Archive old implementation

## Security Considerations

1. **Authentication**
   - User ID included in Redis messages
   - Worker validates user permissions
   - No direct API access from browser

2. **Data Protection**
   - Redis SSL/TLS encryption [[memory:2213337]]
   - No PHI in Redis keys
   - Audit logging for all operations

3. **Access Control**
   - Redis ACLs limit stream access
   - Worker has minimal permissions
   - PHP API key stored securely

## Monitoring & Observability

1. **Redis Streams Monitoring**
   - Stream length metrics
   - Message processing rates
   - Error rates by action type

2. **Worker Health Checks**
   - Heartbeat messages to Redis
   - Processing time metrics
   - Memory and CPU usage

3. **End-to-End Tracing**
   - Correlation IDs link requests/responses
   - Full request lifecycle visibility
   - Performance bottleneck identification

## Conclusion

By leveraging the existing Redis infrastructure, we can completely bypass CORS issues while gaining significant architectural benefits. The event-driven approach provides better scalability, reliability, and user experience compared to direct HTTP calls.

The implementation can be completed in approximately 8 hours with minimal risk, as it runs parallel to the existing system until fully tested.
